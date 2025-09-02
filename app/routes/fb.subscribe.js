// fb.subscribe.js
const clients = new Set();

export function subscribe(req) {
  return new Response("", {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
    body: new ReadableStream({
      start(controller) {
        clients.add(controller);
        controller.enqueue(`event: connected\ndata: ok\n\n`);
      },
      cancel() {
        clients.delete(controller);
      },
    }),
  });
}

export function broadcast(msg) {
  for (const client of clients) {
    client.enqueue(`data: ${JSON.stringify(msg)}\n\n`);
  }
}
