import { json } from "@remix-run/node";
import prisma from "../db.server";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("sessionId");
  const storeDomain = url.searchParams.get("storeDomain");

  if (!sessionId || !storeDomain) {
    return new Response("Missing params", { status: 400 });
  }

  let lastTimestamp = new Date();

  const stream = new ReadableStream({
    async start(controller) {
      // Send any existing messages immediately
      try {
        const initialMessages = await prisma.storeChatMessage.findMany({
          where: { sessionId, storeDomain },
          orderBy: { createdAt: "asc" },
        });

        initialMessages.forEach((msg) => {
          controller.enqueue(`data: ${JSON.stringify(msg)}\n\n`);
          lastTimestamp = new Date(msg.createdAt);
        });
      } catch (err) {
        console.error("Error fetching initial messages:", err);
      }

      // Polling for new messages
      const interval = setInterval(async () => {
        try {
          const messages = await prisma.storeChatMessage.findMany({
            where: { 
              sessionId, 
              storeDomain, 
              createdAt: { gt: lastTimestamp } 
            },
            orderBy: { createdAt: "asc" },
          });

          messages.forEach((msg) => {
            controller.enqueue(`data: ${JSON.stringify(msg)}\n\n`);
            lastTimestamp = new Date(msg.createdAt);
          });
        } catch (err) {
          console.error("Error fetching new messages:", err);
        }
      }, 1000);

      // Cleanup on client disconnect
      controller.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
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
