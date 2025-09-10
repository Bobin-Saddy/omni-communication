import { json } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";
import { v2 as cloudinary } from "cloudinary";

const prisma = new PrismaClient();

// ----------------- Cloudinary config -----------------
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ----------------- CORS -----------------
function getCorsHeaders(request) {
  const origin = request.headers.get("Origin") || "";
  if (origin.endsWith(".myshopify.com") || origin.includes("admin.shopify.com")) {
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Credentials": "true",
    };
  }
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

// ----------------- Loader -----------------
export async function loader({ request }) {
  const corsHeaders = getCorsHeaders(request);
  if (request.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  const url = new URL(request.url);
  const storeDomain = url.searchParams.get("storeDomain") || url.searchParams.get("store_domain");
  const sessionId = url.searchParams.get("sessionId") || url.searchParams.get("session_id");
  const widget = url.searchParams.get("widget") === "true";
  const stream = url.searchParams.get("stream") === "true";

  // Widget sessions
  if (widget) {
    const whereClause = storeDomain ? { storeDomain } : {};
    const sessions = await prisma.storeChatMessage.findMany({
      where: whereClause,
      distinct: ["sessionId"],
      orderBy: { createdAt: "desc" },
      select: { sessionId: true, storeDomain: true },
    });

    const sessionsWithName = await Promise.all(
      sessions.map(async (s) => {
        const lastMessage = await prisma.storeChatMessage.findFirst({
          where: { sessionId: s.sessionId, storeDomain: s.storeDomain },
          orderBy: { createdAt: "desc" },
        });
        return {
          sessionId: s.sessionId,
          storeDomain: s.storeDomain,
          name: lastMessage?.name || `User-${s.sessionId}`,
        };
      })
    );

    return json({ ok: true, sessions: sessionsWithName }, { headers: corsHeaders });
  }

  // SSE stream
  if (stream) {
    if (!storeDomain || !sessionId) {
      return json({ ok: false, error: "Missing params" }, { status: 400, headers: corsHeaders });
    }

    let lastTimestamp = null;
    const encoder = new TextEncoder();
    let interval;

    const sseStream = new ReadableStream({
      async start(controller) {
        try {
          const initialMessages = await prisma.storeChatMessage.findMany({
            where: { storeDomain, sessionId },
            orderBy: { createdAt: "asc" },
          });

          initialMessages.forEach((msg) => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(msg)}\n\n`));
            lastTimestamp = new Date(msg.createdAt);
          });

          interval = setInterval(async () => {
            try {
              const messages = await prisma.storeChatMessage.findMany({
                where: lastTimestamp
                  ? { storeDomain, sessionId, createdAt: { gt: lastTimestamp } }
                  : { storeDomain, sessionId },
                orderBy: { createdAt: "asc" },
              });

              for (const msg of messages) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(msg)}\n\n`));
                lastTimestamp = new Date(msg.createdAt);
              }
            } catch (err) {
              console.error("Error fetching chat messages:", err);
            }
          }, 1000);
        } catch (err) {
          console.error("Error starting SSE:", err);
        }
      },
      async cancel() {
        if (interval) clearInterval(interval);
      },
    });

    return new Response(sseStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        ...corsHeaders,
      },
    });
  }

  // Normal message fetch
  if (!storeDomain || !sessionId) {
    return json({ ok: false, error: "Missing params" }, { status: 400, headers: corsHeaders });
  }

  const messages = await prisma.storeChatMessage.findMany({
    where: { storeDomain, sessionId },
    orderBy: { createdAt: "asc" },
  });

  return json({ ok: true, messages }, { headers: corsHeaders });
}

// ----------------- Action -----------------
export async function action({ request }) {
  const corsHeaders = getCorsHeaders(request);
  if (request.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  let sessionId, storeDomain, sender, message = null, name = null, fileUrl = null, fileName = null;

  // Handle multipart/form-data (file upload)
  if (request.headers.get("content-type")?.includes("multipart/form-data")) {
    const formData = await request.formData();
    sessionId = formData.get("sessionId") || formData.get("session_id");
    storeDomain = formData.get("storeDomain") || formData.get("store_domain");
    sender = formData.get("sender") || "customer";
    name = formData.get("name") || null;
    const file = formData.get("file");

    if (!sessionId || !storeDomain || !file || !name)
      return json({ ok: false, error: "Missing fields" }, { status: 400, headers: corsHeaders });

    fileName = file.name;

    // Upload to Cloudinary
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: "auto", folder: `chat_uploads/${storeDomain}` },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(buffer);
    });

    fileUrl = uploadResult.secure_url;
  } else {
    const body = await request.json();
    sessionId = body.sessionId || body.session_id;
    storeDomain = body.storeDomain || body.store_domain;
    message = body.message || null;
    sender = body.sender || "me";
    name = body.name || `User-${sessionId}`;

    if (!storeDomain || (!message && !body.fileUrl))
      return json({ ok: false, error: "Missing fields" }, { status: 400, headers: corsHeaders });

    if (body.fileUrl) {
      fileUrl = body.fileUrl;
      fileName = body.fileName || "file";
    }
  }

  sender = sender === "customer" ? "customer" : "me";

  // Upsert session
  await prisma.storeChatSession.upsert({
    where: { storeDomain_sessionId: { storeDomain, sessionId } },
    update: {},
    create: { sessionId, storeDomain },
  });

  // Save message
  const savedMessage = await prisma.storeChatMessage.create({
    data: { sessionId, storeDomain, sender, name, text: message, fileUrl, fileName },
  });

  return json({ ok: true, message: savedMessage }, { headers: corsHeaders });
}
