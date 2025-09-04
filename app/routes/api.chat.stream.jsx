

import { db } from "../db.server"; // ya jahan aapka DB hai

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
        // Example: Poll DB every 2 seconds for new messages
        let lastTimestamp = new Date(0); // start from epoch

        const interval = setInterval(async () => {
          // DB query: only messages for this session & domain
          const messages = await db.chat.findMany({
            where: {
              sessionId,
              storeDomain,
              createdAt: { gt: lastTimestamp },
            },
            orderBy: { createdAt: "asc" },
          });

          messages.forEach((msg) => {
            const data = JSON.stringify({
              text: msg.text,
              sender: msg.sender,
              createdAt: msg.createdAt,
            });
            controller.enqueue(`data: ${data}\n\n`);
            lastTimestamp = msg.createdAt;
          });
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
