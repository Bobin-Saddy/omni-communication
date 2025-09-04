// app/routes/api/chat/stream.jsx
import { json } from "@remix-run/node";

export const loader = ({ request }) => {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("sessionId");
  const storeDomain = url.searchParams.get("storeDomain");

  if (!sessionId) {
    return json({ error: "sessionId is required" }, { status: 400 });
  }

  return new Response(
    new ReadableStream({
      start(controller) {
        // Example: send a message every 2s
        const interval = setInterval(() => {
          const data = JSON.stringify({
            text: "Hello from server",
            createdAt: new Date().toISOString(),
            sender: "them",
          });
          controller.enqueue(`data: ${data}\n\n`);
        }, 2000);

        // Cleanup when client disconnects
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
