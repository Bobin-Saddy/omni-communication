import { json } from "@remix-run/node";

// Meta verification (GET)
export async function loader({ request }) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  const VERIFY_TOKEN = "12345"; // match Meta dashboard exactly

  if (mode && token) {
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("✅ Webhook verified");
      return new Response(challenge, { status: 200 });
    } else {
      return new Response("Forbidden", { status: 403 });
    }
  }
  return new Response("No content", { status: 200 });
}

// WhatsApp POST messages
export async function action({ request }) {
  const body = await request.json();

  if (body.object) {
    body.entry?.forEach(entry => {
      entry.changes?.forEach(change => {
        const value = change.value || {};
        const messages = value.messages || [];

        messages.forEach(message => {
          console.log("📩 New message from:", message.from);
          console.log("Message text:", message.text?.body);

          // TODO: Save to DB so Shopify dashboard can display
        });
      });
    });

    return json({ status: "received" });
  } else {
    return new Response(null, { status: 404 });
  }
}
