import { json } from "@remix-run/node";

const VERIFY_TOKEN = "12345";

// Shared in-memory store (import this from a separate module for persistence)
export const messageStore = {};

// GET: Verify webhook (Facebook/WhatsApp challenge)
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

// POST: Handle incoming WhatsApp webhook events
export async function action({ request }) {
  const body = await request.json();

  console.log("WhatsApp webhook POST received:", JSON.stringify(body, null, 2));

  // Parse incoming messages and store them
  body.entry?.forEach((entry) => {
    entry.changes?.forEach((change) => {
      const value = change.value;
      if (!value) return;

      // Example: messages array inside value.messages
      const messages = value.messages || [];
      const phoneNumber = value.metadata?.phone_number_id; // Your WhatsApp business number id
      messages.forEach((msg) => {
        const from = msg.from; // sender phone number (user)
        if (!from) return;

        // Initialize message array if not present
        if (!messageStore[from]) {
          messageStore[from] = [];
        }

        // Store normalized message
        messageStore[from].push({
          id: msg.id,
          from,
          message: msg.text?.body || "", // text message body
          created_time: msg.timestamp ? new Date(msg.timestamp * 1000).toISOString() : new Date().toISOString(),
          raw: msg, // optional: store raw message object for debugging
        });
      });
    });
  });

  return json({ received: true });
}
