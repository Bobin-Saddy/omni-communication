import { json } from "@remix-run/node";

const VERIFY_TOKEN = "12345";

// In-memory message store: { [phoneNumber]: [messages...] }
const messageStore = {};

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
  const body = await request.json();

  console.log("WhatsApp webhook POST received:", JSON.stringify(body, null, 2));

  // Extract messages from webhook payload
  body.entry?.forEach((entry) => {
    entry.changes?.forEach((change) => {
      console.log("Webhook change value:", JSON.stringify(change.value, null, 2));
    });
  });

  return json({ received: true });
}
