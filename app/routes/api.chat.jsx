import { json } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ----------------- CORS -----------------
function getCorsHeaders(request) {
  const origin = request.headers.get("Origin") || "";
  if (origin.endsWith(".myshopify.com")) {
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };
  }
  return { "Access-Control-Allow-Origin": "null" };
}

// ----------------- LOADER -----------------
export async function loader({ request }) {
  const corsHeaders = getCorsHeaders(request);
  if (request.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  const url = new URL(request.url);
  const storeDomain =
    url.searchParams.get("store_domain") ||
    url.searchParams.get("storeDomain");
  const sessionId =
    url.searchParams.get("session_id") || url.searchParams.get("sessionId");
  const widget = url.searchParams.get("widget") === "true";
  const stream = url.searchParams.get("stream") === "true";

  // ----------------- Widget sessions -----------------
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

  // ----------------- SSE stream -----------------
  if (stream) {
    if (!storeDomain || !sessionId) {
      return json(
        { ok: false, error: "Missing params" },
        { status: 400, headers: corsHeaders }
      );
    }

    let lastTimestamp = null;
    const encoder = new TextEncoder();

    const sseStream = new ReadableStream({
      async start(controller) {
        // Send all existing messages first
        const initialMessages = await prisma.storeChatMessage.findMany({
          where: { storeDomain, sessionId },
          orderBy: { createdAt: "asc" },
        });

        initialMessages.forEach((msg) => {
          try {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(msg)}\n\n`)
            );
            lastTimestamp = new Date(msg.createdAt);
          } catch (e) {
            console.error("Error enqueueing initial messages:", e);
          }
        });

        const interval = setInterval(async () => {
          try {
            const messages = await prisma.storeChatMessage.findMany({
              where: lastTimestamp
                ? { storeDomain, sessionId, createdAt: { gt: lastTimestamp } }
                : { storeDomain, sessionId },
              orderBy: { createdAt: "asc" },
            });

            messages.forEach((msg) => {
              try {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify(msg)}\n\n`)
                );
                lastTimestamp = new Date(msg.createdAt);
              } catch (err) {
                console.error("Stream closed, cannot enqueue:", err);
              }
            });
          } catch (err) {
            console.error("Error fetching chat messages:", err);
          }
        }, 1000);

        // ✅ Proper cleanup on disconnect
        controller.signal.addEventListener("abort", () => {
          clearInterval(interval);
          try {
            controller.close();
          } catch (e) {
            // already closed
          }
        });
      },

      cancel() {
        // In case of early cancellation
        try {
          controller.close();
        } catch {}
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

  // ----------------- Fetch messages for a session -----------------
  if (!storeDomain || !sessionId) {
    return json(
      { ok: false, error: "Missing params" },
      { status: 400, headers: corsHeaders }
    );
  }

  const messages = await prisma.storeChatMessage.findMany({
    where: { storeDomain, sessionId },
    orderBy: { createdAt: "asc" },
  });

  return json({ ok: true, messages }, { headers: corsHeaders });
}

// ----------------- ACTION -----------------
export async function action({ request }) {
  const corsHeaders = getCorsHeaders(request);
  if (request.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  let sessionId,
    storeDomain,
    sender,
    message = null,
    name = null,
    fileUrl = null,
    fileName = null;

  if (request.headers.get("content-type")?.includes("multipart/form-data")) {
    const formData = await request.formData();
    sessionId = formData.get("sessionId") || formData.get("session_id");
    storeDomain = formData.get("storeDomain") || formData.get("store_domain");
    sender = formData.get("sender") || "customer";
    name = formData.get("name") || null;
    const file = formData.get("file");

    if (!sessionId || !storeDomain || !file || !name) {
      return json({ ok: false, error: "Missing fields" }, { status: 400, headers: corsHeaders });
    }

    fileName = file.name;
    fileUrl = `/uploads/${fileName}`; // TODO: Replace with real storage
  } else {
    const body = await request.json();
    sessionId = body.sessionId || body.session_id;
    storeDomain = body.storeDomain || body.store_domain;
    message = body.message || null;
    sender = body.sender || "me";
    name = body.name || `User-${sessionId}`;

    if (!storeDomain || (!message && !body.fileUrl)) {
      return json({ ok: false, error: "Missing fields" }, { status: 400, headers: corsHeaders });
    }

    if (body.fileUrl) {
      fileUrl = body.fileUrl;
      fileName = body.fileName || "file";
    }
  }

  sender = sender === "customer" ? "customer" : "me";

  await prisma.storeChatSession.upsert({
    where: { storeDomain_sessionId: { storeDomain, sessionId } },
    update: {},
    create: { sessionId, storeDomain },
  });

  const savedMessage = await prisma.storeChatMessage.create({
    data: { sessionId, storeDomain, sender, name, text: message, fileUrl, fileName },
  });

  return json({ ok: true, message: savedMessage }, { headers: corsHeaders });
}
