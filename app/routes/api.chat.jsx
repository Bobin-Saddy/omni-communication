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

// ----------------- GET messages or sessions -----------------
export async function loader({ request }) {
  const corsHeaders = getCorsHeaders(request);
  if (request.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  const url = new URL(request.url);

  // ----------------- Widget sessions -----------------
  if (url.searchParams.get("widget") === "true") {
    const sessions = await prisma.storeChatMessage.findMany({
      distinct: ["sessionId", "storeDomain"],
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

  // ----------------- Fetch messages for a session -----------------
  const storeDomain =
    url.searchParams.get("store_domain") || url.searchParams.get("storeDomain");
  const sessionId =
    url.searchParams.get("session_id") || url.searchParams.get("sessionId");

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

// ----------------- POST message (text or file) -----------------
export async function action({ request }) {
  const corsHeaders = getCorsHeaders(request);
  if (request.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  let sessionId, storeDomain, sender, message, name = null, fileUrl = null, fileName = null;

  // ----------------- File upload -----------------
  if (request.headers.get("content-type")?.includes("multipart/form-data")) {
    const formData = await request.formData();

    sessionId = formData.get("sessionId") || formData.get("session_id");
    storeDomain = formData.get("storeDomain") || formData.get("store_domain");
    sender = formData.get("sender") || "customer";
    name = formData.get("name") || null;
    const file = formData.get("file");

    if (!sessionId || !storeDomain || !file || !name) {
      return json(
        { ok: false, error: "Missing fields" },
        { status: 400, headers: corsHeaders }
      );
    }

    fileName = file.name;
    fileUrl = `/uploads/${fileName}`; // TODO: Replace with real storage (S3/Cloudinary)
    message = null;
  } 
  // ----------------- Text message -----------------
  else {
    const body = await request.json();
    sessionId = body.sessionId || body.session_id;
    storeDomain = body.storeDomain || body.store_domain;
    message = body.message || null;
    sender = body.sender || "me";
    name = body.name || null;

    if (!storeDomain || !name || (!message && !body.fileUrl)) {
      return json(
        { ok: false, error: "Missing fields" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (body.fileUrl) {
      fileUrl = body.fileUrl;
      fileName = body.fileName || "file";
    }
  }

  // Normalize sender
  sender = sender === "customer" ? "customer" : "me";

  // ----------------- Ensure session exists -----------------
  await prisma.storeChatSession.upsert({
    where: { sessionId },
    update: {},
    create: { sessionId, storeDomain },
  });

  // ----------------- Save message -----------------
  const savedMessage = await prisma.storeChatMessage.create({
    data: { sessionId, storeDomain, sender, name, text: message, fileUrl, fileName },
  });

  return json(
    { ok: true, message: { ...savedMessage, fileUrl, fileName } },
    { headers: corsHeaders }
  );
}
