import { json } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ✅ Shared CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "https://seo-partner.myshopify.com", // your Shopify domain
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Handle CORS preflight
export async function loader({ request }) {
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

export async function action({ request }) {
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
