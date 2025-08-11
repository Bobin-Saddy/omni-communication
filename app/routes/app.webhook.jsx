// app/routes/api/webhook.jsx
import { json } from "@remix-run/node";
import { storeWhatsAppMessage } from "./webhook";


export async function action({ request }) {
  const body = await request.json();
  
  const entry = body.entry?.[0]?.changes?.[0]?.value;
  if (entry?.messages) {
    entry.messages.forEach(msg => {
      storeWhatsAppMessage({
        id: msg.id,
        from: msg.from,
        text: msg.text?.body || "",
        timestamp: msg.timestamp
      });
    });
  }
  
  return json({ status: "ok" });
}

export async function loader({ request }) {
  // For webhook verification with Meta
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode && token) {
    if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      return new Response(challenge, { status: 200 });
    } else {
      return new Response("Forbidden", { status: 403 });
    }
  }

  return new Response("No verification params", { status: 400 });
}
