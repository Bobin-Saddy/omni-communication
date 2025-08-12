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
  const body = await request.json();
  console.log("WhatsApp webhook POST received:", JSON.stringify(body, null, 2));

  body.entry?.forEach((entry) => {
    entry.changes?.forEach((change) => {
      const value = change.value;
      if (!value) return;

      // ✅ Save contact name if available
      const contacts = value.contacts || [];
      contacts.forEach((contact) => {
        const wa_id = contact.wa_id; // Phone number
        const profileName = contact.profile?.name || "WhatsApp User";

        if (!messageStore[wa_id]) {
          messageStore[wa_id] = { profileName, messages: [] };
        } else {
          messageStore[wa_id].profileName = profileName;
        }
      });

      // ✅ Handle incoming messages
      const messages = value.messages || [];
      messages.forEach((msg) => {
        const from = msg.from;
        if (!from) return;

        if (!messageStore[from]) {
          messageStore[from] = { profileName: "WhatsApp User", messages: [] };
        }

        messageStore[from].messages.push({
          id: msg.id,
          from,
          message: msg.text?.body || "",
          created_time: msg.timestamp
            ? new Date(parseInt(msg.timestamp) * 1000).toISOString()
            : new Date().toISOString(),
          type: "message",
        });
      });

      // ✅ Handle status updates
      const statuses = value.statuses || [];
      statuses.forEach((status) => {
        const recipient = status.recipient_id;
        if (!recipient) return;

        if (!messageStore[recipient]) {
          messageStore[recipient] = { profileName: "WhatsApp User", messages: [] };
        }

        messageStore[recipient].messages.push({
          id: status.id,
          from: recipient,
          status: status.status,
          created_time: status.timestamp
            ? new Date(parseInt(status.timestamp) * 1000).toISOString()
            : new Date().toISOString(),
          type: "status",
        });
      });
    });
  });

  return json({ received: true });
}

