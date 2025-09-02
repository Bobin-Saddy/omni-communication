let clients = [];

export async function loader({ request }) {
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();

  clients.push(writer);

  // Send heartbeat every 25s so Heroku doesn't kill the connection
  const interval = setInterval(() => {
    writer.write(new TextEncoder().encode(":\n\n"));
  }, 25000);

  request.signal.addEventListener("abort", () => {
    clearInterval(interval);
    clients = clients.filter(c => c !== writer);
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

export function broadcast(message) {
  const data = `data: ${JSON.stringify(message)}\n\n`;
  clients.forEach(writer => writer.write(new TextEncoder().encode(data)));
}
