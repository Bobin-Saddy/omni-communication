import { json } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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

// GET messages or sessions
export async function loader({ request }) {
  const corsHeaders = getCorsHeaders(request);
  if (request.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  const url = new URL(request.url);

  // Fetch all widget sessions
if (url.searchParams.get("widget") === "true") {
  // Fetch sessions with the last message to get the name
  const sessions = await prisma.storeChatSession.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1, // only last message
      },
    },
  });

  // Map name from last message
  const sessionsWithName = sessions.map((s) => ({
    sessionId: s.sessionId,
    storeDomain: s.storeDomain,
    createdAt: s.createdAt,
    name: s.messages[0]?.name || "Unknown User", // <- name comes from last message
  }));

  return json({ ok: true, sessions: sessionsWithName }, { headers: corsHeaders });
}


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

// POST message (text or file)
export async function action({ request }) {
  const corsHeaders = getCorsHeaders(request);
  if (request.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  let sessionId, storeDomain, sender, message, name = null, fileUrl = null, fileName = null;

  // 🔹 Case 1: File Upload (multipart/form-data)
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

    // ⚡️ fileUrl बनाओ (S3/Cloudinary use कर सकते हो, अभी local path demo है)
    fileName = file.name;
    fileUrl = `/uploads/${fileName}`; // TODO: Replace with actual storage upload
    message = null;
  } 
  // 🔹 Case 2: Text message (application/json)
  else {
    const body = await request.json();
    sessionId = body.sessionId || body.session_id;
    storeDomain = body.storeDomain || body.store_domain;
    message = body.message || null;
    sender = body.sender || "me";
    name = body.name || null;

    if (!sessionId || !storeDomain || !name || (!message && !body.fileUrl)) {
      return json(
        { ok: false, error: "Missing fields" },
        { status: 400, headers: corsHeaders }
      );
    }

    // अगर frontend से fileUrl आ रहा है तो उसे भी save कर सकते हैं
    if (body.fileUrl) {
      fileUrl = body.fileUrl;
      fileName = body.fileName || "file";
    }
  }

  // 🔹 Sender normalize
  sender = sender === "customer" ? "customer" : "me";

  // ✅ Ensure session exists
  await prisma.storeChatSession.upsert({
    where: { sessionId },
    update: {},
    create: { sessionId, storeDomain },
  });

  // ✅ Save message (text or file) with name
  const savedMessage = await prisma.storeChatMessage.create({
    data: { sessionId, storeDomain, sender, name, text: message, fileUrl, fileName },
  });

  // ✅ Return full message with fileUrl so frontend can show image
  return json(
    { ok: true, message: { ...savedMessage, fileUrl, fileName } },
    { headers: corsHeaders }
  );
}
