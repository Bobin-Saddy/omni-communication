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
  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(request.url);

  // Fetch all widget sessions
  if (url.searchParams.get("widget") === "true") {
    const sessions = await prisma.storeChatSession.findMany({
      orderBy: { createdAt: "desc" },
    });
    return json({ ok: true, sessions }, { headers: corsHeaders });
  }

  const storeDomain = url.searchParams.get("store_domain") || url.searchParams.get("storeDomain");
  const sessionId = url.searchParams.get("session_id") || url.searchParams.get("sessionId");

  if (!storeDomain || !sessionId) {
    return json({ ok: false, error: "Missing params" }, { status: 400, headers: corsHeaders });
  }

  const messages = await prisma.storeChatMessage.findMany({
    where: { storeDomain, sessionId },
    orderBy: { createdAt: "asc" },
  });

  return json({ ok: true, messages }, { headers: corsHeaders });
}

// POST message
export async function action({ request }) {
  const corsHeaders = getCorsHeaders(request);
  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const body = await request.json();

  // Accept both frontend and backend field names
  const sessionId = body.sessionId || body.session_id;
  const storeDomain = body.storeDomain || body.store_domain;
  const message = body.message;
  let sender = body.sender;

  if (!sessionId || !storeDomain || !message) {
    return json({ ok: false, error: "Missing fields" }, { status: 400, headers: corsHeaders });
  }

  // Map sender to standardized values
  if (!sender) sender = "me"; // default from backend
  sender = sender === "customer" ? "customer" : "me"; // frontend = customer, backend = me

  // Ensure session exists
  await prisma.storeChatSession.upsert({
    where: { sessionId },
    update: {},
    create: { sessionId, storeDomain },
  });

  // Save the message
  const savedMessage = await prisma.storeChatMessage.create({
    data: { sessionId, storeDomain, sender, text: message },
  });

  return json({ ok: true, message: savedMessage }, { headers: corsHeaders });
}
