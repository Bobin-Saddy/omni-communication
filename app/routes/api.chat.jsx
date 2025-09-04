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
  const storeDomain = url.searchParams.get("store_domain") || url.searchParams.get("storeDomain");
  const sessionId = url.searchParams.get("session_id") || url.searchParams.get("sessionId");
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
      return json({ ok: false, error: "Missing params" }, { status: 400, headers: corsHeaders });
    }

    let lastTimestamp = new Date();

    const sseStream = new ReadableStream({
      async start(controller) {
        // Immediately send existing messages
        const initialMessages = await prisma.storeChatMessage.findMany({
          where: { storeDomain, sessionId },
          orderBy: { createdAt: "asc" },
        });

        initialMessages.forEach((msg) => {
          controller.enqueue(`data: ${JSON.stringify(msg)}\n\n`);
          lastTimestamp = new Date(msg.createdAt);
        });

        const interval = setInterval(async () => {
          try {
            const messages = await prisma.storeChatMessage.findMany({
              where: { storeDomain, sessionId, createdAt: { gt: lastTimestamp } },
              orderBy: { createdAt: "asc" },
            });

            messages.forEach((msg) => {
              controller.enqueue(`data: ${JSON.stringify(msg)}\n\n`);
              lastTimestamp = new Date(msg.createdAt);
            });
          } catch (err) {
            console.error("Error fetching chat messages:", err);
          }
        }, 1000);

        controller.signal.addEventListener("abort", () => {
          clearInterval(interval);
          controller.close();
        });
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
    return json({ ok: false, error: "Missing params" }, { status: 400, headers: corsHeaders });
  }

  const messages = await prisma.storeChatMessage.findMany({
    where: { storeDomain, sessionId },
    orderBy: { createdAt: "asc" },
  });

  return json({ ok: true, messages }, { headers: corsHeaders });
}
