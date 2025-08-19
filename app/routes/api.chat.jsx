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

// GET all widget sessions
export async function loader({ request }) {
  const corsHeaders = getCorsHeaders(request);

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(request.url);

  // If fetching all widget sessions
  if (url.searchParams.get("widget") === "true") {
    const sessions = await prisma.storeChatSession.findMany({
      orderBy: { createdAt: "desc" },
    });
    return json({ ok: true, sessions }, { headers: corsHeaders });
  }

  const storeDomain = url.searchParams.get("store_domain");
  const sessionId = url.searchParams.get("session_id");

  if (!storeDomain || !sessionId) {
    return json({ ok: false, error: "Missing params" }, { status: 400, headers: corsHeaders });
  }

  const messages = await prisma.storeChatMessage.findMany({
    where: { storeDomain, sessionId },
    orderBy: { createdAt: "asc" },
  });

  return json({ ok: true, messages }, { headers: corsHeaders });
}


export async function action({ request }) {
  const corsHeaders = getCorsHeaders(request);
  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const body = await request.json();
  const { session_id, message, sender, store_domain } = body;

  if (!session_id || !message || !sender || !store_domain) {
    return json({ ok: false, error: "Missing fields" }, { status: 400, headers: corsHeaders });
  }

  await prisma.storeChatSession.upsert({
    where: { sessionId: session_id },
    update: {},
    create: { sessionId: session_id, storeDomain: store_domain },
  });

  await prisma.storeChatMessage.create({
    data: { sessionId: session_id, storeDomain: store_domain, sender, text: message },
  });

  return json({ ok: true }, { headers: corsHeaders });
}
