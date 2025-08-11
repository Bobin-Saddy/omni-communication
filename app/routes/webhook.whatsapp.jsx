// app/routes/webhook.whatsapp.jsx
import { json } from "@remix-run/node";

let receivedMessages = []; // Temporary in-memory store (replace with DB in production)

export async function loader({ request }) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  const VERIFY_TOKEN = "12345";

  if (mode && token) {
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("✅ Webhook verified");
      return new Response(challenge, { status: 200 });
    }
    return new Response("Forbidden", { status: 403 });
  }

  return new Response("No content", { status: 200 });
}

export async function action({ request }) {
  const body = await request.json();

  if (body.object) {
    body.entry?.forEach(entry => {
      entry.changes?.forEach(change => {
        const value = change.value || {};

        // Handle incoming messages
        value.messages?.forEach(message => {
          const from = message.from; // Phone number
          const text = message.text?.body;
          console.log("📩 New message from:", from);
          console.log("Message text:", text);

          // Save to in-memory store (use DB in real app)
          receivedMessages.push({
            id: Date.now().toString(),
            from,
            text,
            created_time: new Date().toISOString(),
          });
        });
      });
    });

    return json({ status: "received" });
  }
  return new Response(null, { status: 404 });
}

// Endpoint to fetch messages from frontend
export async function getMessagesLoader() {
  return json({ messages: receivedMessages });
}
