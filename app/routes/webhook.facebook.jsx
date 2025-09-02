// routes/webhook.facebook.jsx
import { broadcast } from "./fb.subscribe";

export async function action({ request }) {
  const body = await request.json();
  const msg = body.entry?.[0]?.messaging?.[0];
  if (!msg || !msg.message) return new Response("EVENT_RECEIVED");

  const incoming = {
    convId: msg.sender.id, // or conversation id
    sender: "them",
    text: msg.message.text,
    createdAt: new Date().toISOString(),
  };

  broadcast(incoming);
  return new Response("EVENT_RECEIVED");
}
