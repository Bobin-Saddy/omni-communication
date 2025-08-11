import { json } from "@remix-run/node";
import { messageStore } from "./app.messageStore";

const VERIFY_TOKEN = "12345";

export async function loader({ request }) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }
  return new Response("Verification failed", { status: 403 });
}

export async function action({ request }) {
      console.log("WhatsApp webhook POST received:", JSON.stringify(body, null, 2));
  const body = await request.json();

  body.entry?.forEach((entry) => {
    entry.changes?.forEach((change) => {
      const value = change.value;
      if (!value) return;

      const messages = value.messages || [];
      messages.forEach((msg) => {
        const from = msg.from;
        if (!from) return;

        if (!messageStore[from]) {
          messageStore[from] = [];
        }

        messageStore[from].push({
          id: msg.id,
          from,
          message: msg.text?.body || "",
          created_time: msg.timestamp ? new Date(parseInt(msg.timestamp) * 1000).toISOString() : new Date().toISOString(),
        });
      });
    });
  });

  return json({ received: true });
}
