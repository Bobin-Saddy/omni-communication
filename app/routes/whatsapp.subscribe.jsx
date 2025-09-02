let clients = []; // store connected clients

export async function loader({ request }) {
  const { readable, writable } = new TransformStream();
  const res = new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });

  const client = writable.getWriter();
  clients.push(client);

  request.signal.addEventListener("abort", () => {
    clients = clients.filter(c => c !== client);
  });

  return res;
}

// helper function to broadcast message to all clients
export function broadcast(message) {
  const data = `data: ${JSON.stringify(message)}\n\n`;
  clients.forEach((client) => {
    client.write(new TextEncoder().encode(data));
  });
}
