import { json } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ✅ Function to build dynamic CORS headers
function getCorsHeaders(request) {
  const origin = request.headers.get("Origin") || "";

  // Allow all *.myshopify.com domains
  if (origin && origin.endsWith(".myshopify.com")) {
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Credentials": "true", // if using cookies/sessions
    };
  }

  // For development: allow localhost too
  if (origin.includes("localhost")) {
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };
  }

  // Block everything else
  return {};
}

// ✅ Helper to normalize Shopify domains
// helper (put in utils/domain.js or top of file)
function normalizeStoreDomain(domain) {
  if (!domain) return "";
  return domain.replace(".myshopify.com", "").trim();
}

export async function loader({ request }) {
  const url = new URL(request.url);
  const host = url.searchParams.get("shop"); // e.g. seo-partner.myshopify.com

  const storeName = host ? normalizeStoreDomain(host) : null;

  const sessions = await prisma.storeChatSession.findMany({
    where: storeName ? { storeDomain: storeName } : {},
    orderBy: { lastSeenAt: "desc" },
  });

  return json({ sessions, storeName });
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

  const storeDomain = normalizeStoreDomain(store_domain);

  // Create session if not exists
  await prisma.storeChatSession.upsert({
    where: { sessionId: session_id },
    update: {},
    create: {
      storeDomain,
      sessionId: session_id,
    },
  });

  // Save message
  await prisma.storeChatMessage.create({
    data: {
      storeDomain,
      sessionId: session_id,
      sender,
      text: message,
    },
  });

  return json({ ok: true }, { headers: corsHeaders });
}
