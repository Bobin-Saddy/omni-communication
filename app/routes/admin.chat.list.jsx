import { json } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function loader({ request }) {
  try {
    const url = new URL(request.url);
    const conversationId = url.searchParams.get("conversationId");
    const sessionId = url.searchParams.get("sessionId");
    const shop = url.searchParams.get("shop");

    // Internal chat system
    if (conversationId) {
      const convId = parseInt(conversationId, 10);
      if (isNaN(convId)) return json({ messages: [] });

      const messages = await prisma.chatMessage.findMany({
        where: { conversationId: convId },
        orderBy: { createdAt: "asc" },
      });

      return json({ messages });
    }

    // Store chat system (widget, FB, IG, WA…) with streaming
    if (sessionId) {
      const stream = new ReadableStream({
        async start(controller) {
          let lastTimestamp = new Date(0);

          const interval = setInterval(async () => {
            try {
              const messages = await prisma.storeChatMessage.findMany({
                where: {
                  sessionId,
                  createdAt: { gt: lastTimestamp },
                },
                orderBy: { createdAt: "asc" },
              });

              messages.forEach((msg) => {
                controller.enqueue(
                  `data: ${JSON.stringify({
                    id: msg.id,
                    text: msg.text,
                    sender: msg.sender,
                    name: msg.name,
                    fileUrl: msg.fileUrl,
                    fileName: msg.fileName,
                    createdAt: msg.createdAt,
                    sessionId: msg.sessionId,
                    storeDomain: msg.storeDomain,
                  })}\n\n`
                );
                lastTimestamp = msg.createdAt;
              });
            } catch (err) {
              console.error("Error fetching chat messages:", err);
            }
          }, 2000);

          return {
            cancel() {
              clearInterval(interval);
            },
          };
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // Fetch sessions for a specific shop
    if (shop) {
      const sessions = await prisma.storeChatSession.findMany({
        where: { storeDomain: shop },
        orderBy: { lastSeenAt: "desc" },
      });

      return json({ sessions });
    }

    // Default: all store sessions
    const sessions = await prisma.storeChatSession.findMany({
      orderBy: { lastSeenAt: "desc" },
    });

    return json({ sessions });
  } catch (err) {
    console.error("Loader error:", err);
    return json({ sessions: [], messages: [] });
  }
}
