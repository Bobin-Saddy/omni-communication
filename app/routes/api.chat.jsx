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
    const sessions = await prisma.storeChatSession.findMany({
      orderBy: { createdAt: "desc" },
    });
    return json({ ok: true, sessions }, { headers: corsHeaders });
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

  // Handle file uploads (multipart/form-data)
  if (request.headers.get("content-type")?.includes("multipart/form-data")) {
    const formData = await request.formData();

    const sessionId = formData.get("sessionId") || formData.get("session_id");
    const storeDomain =
      formData.get("storeDomain") || formData.get("store_domain");
    const sender = formData.get("sender") || "customer";
    const file = formData.get("file");

    if (!sessionId || !storeDomain || !file) {
      return json(
        { ok: false, error: "Missing fields" },
        { status: 400, headers: corsHeaders }
      );
    }

    // NOTE: Right now we just use the uploaded file's name & URL (depends where you store it)
    // If you’re using something like S3, replace this with actual upload logic
    const fileName = file.name;
    const fileUrl = `/uploads/${fileName}`; // replace with actual storage path

    await prisma.storeChatSession.upsert({
      where: { sessionId },
      update: {},
      create: { sessionId, storeDomain },
    });

    const savedMessage = await prisma.storeChatMessage.create({
      data: {
        sessionId,
        storeDomain,
        sender: sender === "customer" ? "customer" : "me",
        text: null,
        fileUrl,
        fileName,
      },
    });

    return json({ ok: true, message: savedMessage }, { headers: corsHeaders });
  }

  // Handle text messages (application/json)
  const body = await request.json();
  const sessionId = body.sessionId || body.session_id;
  const storeDomain = body.storeDomain || body.store_domain;
  const message = body.message;
  let sender = body.sender;

  if (!sessionId || !storeDomain || !message) {
    return json(
      { ok: false, error: "Missing fields" },
      { status: 400, headers: corsHeaders }
    );
  }

  // Map sender to standardized values
  if (!sender) sender = "me";
  sender = sender === "customer" ? "customer" : "me";

  await prisma.storeChatSession.upsert({
    where: { sessionId },
    update: {},
    create: { sessionId, storeDomain },
  });

  const savedMessage = await prisma.storeChatMessage.create({
    data: { sessionId, storeDomain, sender, text: message },
  });

  return json({ ok: true, message: savedMessage }, { headers: corsHeaders });
}
