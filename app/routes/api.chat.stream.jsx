import { json } from "@remix-run/node";
import prisma from "../db.server";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("sessionId");
  const storeDomain = url.searchParams.get("storeDomain");

  if (!sessionId || !storeDomain) {
    return new Response("Missing params", { status: 400 });
  }

  return new Response(
    new ReadableStream({
      async start(controller) {
        let lastTimestamp = new Date(0); // start from epoch

        const interval = setInterval(async () => {
          try {
            // DB query: only messages for this session & store
            const messages = await prisma.StoreChatMessage.findMany({
              where: {
                sessionId,
                storeDomain,
                createdAt: { gt: lastTimestamp },
              },
              orderBy: { createdAt: "asc" },
            });

            messages.forEach((msg) => {
              const data = JSON.stringify({
                id: msg.id,
                text: msg.text,
                sender: msg.sender,
                name: msg.name,
                fileUrl: msg.fileUrl,
                fileName: msg.fileName,
                createdAt: msg.createdAt,
              });
              controller.enqueue(`data: ${data}\n\n`);
              lastTimestamp = msg.createdAt;
            });
          } catch (err) {
            console.error("Error fetching chat messages:", err);
          }
        }, 2000);

        return () => clearInterval(interval);
      },
    }),
    {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    }
  );
};
