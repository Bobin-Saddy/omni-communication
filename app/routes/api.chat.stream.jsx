import { json } from "@remix-run/node";
import prisma from "../db.server";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("sessionId");
  const storeDomain = url.searchParams.get("storeDomain");

  if (!sessionId || !storeDomain) {
    return new Response("Missing params", { status: 400 });
  }

const stream = new ReadableStream({
  async start(controller) {
    let lastTimestamp = new Date();

    // Immediately fetch any existing messages (optional)
    const initialMessages = await prisma.storeChatMessage.findMany({
      where: { sessionId, storeDomain },
      orderBy: { createdAt: "asc" },
    });

    initialMessages.forEach((msg) => {
      controller.enqueue(`data: ${JSON.stringify(msg)}\n\n`);
      lastTimestamp = msg.createdAt;
    });

    const interval = setInterval(async () => {
      try {
        const messages = await prisma.storeChatMessage.findMany({
          where: { sessionId, storeDomain, createdAt: { gt: lastTimestamp } },
          orderBy: { createdAt: "asc" },
        });

        messages.forEach((msg) => {
          controller.enqueue(`data: ${JSON.stringify(msg)}\n\n`);
          lastTimestamp = msg.createdAt;
        });
      } catch (err) {
        console.error("Error fetching chat messages:", err);
      }
    }, 1000); // Poll every 1s instead of 2s

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
};
