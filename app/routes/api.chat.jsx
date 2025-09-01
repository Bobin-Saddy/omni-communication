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
    // 1️⃣ Get all unique sessions
    const sessions = await prisma.storeChatMessage.findMany({
      distinct: ["sessionId", "storeDomain"], // unique sessionId per store
      orderBy: { createdAt: "desc" },
      select: {
        sessionId: true,
        storeDomain: true,
      },
    });

    // 2️⃣ Get the latest message for each session to get the name
    const sessionsWithName = await Promise.all(
      sessions.map(async (s) => {
        const lastMessage = await prisma.storeChatMessage.findFirst({
          where: { sessionId: s.sessionId, storeDomain: s.storeDomain },
          orderBy: { createdAt: "desc" },
        });

        return {
          sessionId: s.sessionId,
          storeDomain: s.storeDomain,
          name: lastMessage?.name || "Unknown User",
        };
      })
    );

    return json({ ok: true, sessions: sessionsWithName }, { headers: corsHeaders });
  }

  // Otherwise, fetch messages for a specific session
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

    if (!storeDomain || !name || (!message && !body.fileUrl)) {
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
      create: { sessionId: crypto.randomUUID(), storeDomain, name },
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
