import { json } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ✅ Function to build dynamic CORS headers
function getCorsHeaders(request) {
  const origin = request.headers.get("Origin") || "";

  if (origin.endsWith(".myshopify.com")) {
    return {
      "Access-Control-Allow-Origin": origin, // allow that specific shop
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };
  }

  // ❌ default: block if not Shopify
  return {
    "Access-Control-Allow-Origin": "null",
  };
}

// ---------------- Loader ----------------
export async function loader({ request }) {
  const corsHeaders = getCorsHeaders(request);

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(request.url);
  const storeDomain = url.searchParams.get("store_domain");
  const sessionId = url.searchParams.get("session_id");
  const since = url.searchParams.get("since");

  if (!storeDomain || !sessionId) {
    return json({ ok: false, error: "Missing params" }, { status: 400, headers: corsHeaders });
  }

  const where = { storeDomain, sessionId };
  if (since) {
    where.createdAt = { gt: new Date(since) };
  }

  const messages = await prisma.storeChatMessage.findMany({
    where,
    orderBy: { createdAt: "asc" },
  });

  return json({ ok: true, messages }, { headers: corsHeaders });
}

// ---------------- Action ----------------
export async function action({ request }) {
  const corsHeaders = getCorsHeaders(request);

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const body = await request.json();
  const { store_domain, session_id, message, sender } = body;

  if (!store_domain || !session_id || !message || !sender) {
    return json({ ok: false, error: "Missing fields" }, { status: 400, headers: corsHeaders });
  }

  // Create session if not exists
  await prisma.storeChatSession.upsert({
    where: { sessionId: session_id },
    update: {},
    create: {
      storeDomain: store_domain,
      sessionId: session_id,
    },
  });

  // Save message
  await prisma.storeChatMessage.create({
    data: {
      storeDomain: store_domain,
      sessionId: session_id,
      sender,
      text: message,
    },
  });

  return json({ ok: true }, { headers: corsHeaders });
}
