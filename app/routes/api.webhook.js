// app/routes/api/webhook.js

import { saveMessage } from "./messagesStore";

export async function action({ request }) {
  const body = await request.json();

  const entries = body?.entry || [];
  entries.forEach((entry) => {
    const changes = entry.changes || [];
    changes.forEach((change) => {
      const messages = change?.value?.messages;
      if (messages && messages.length > 0) {
        messages.forEach((msg) => {
          const from = msg.from;
          const text = msg.text?.body;
          if (from && text) {
            saveMessage(from, { sender: "Customer", text });
          }
        });
      }
    });
  });

  return new Response("EVENT_RECEIVED", { status: 200 });
}

export async function loader({ request }) {
  // Meta's verification callback
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode && token && mode === "subscribe" && token === "your_verify_token") {
    return new Response(challenge, { status: 200 });
  } else {
    return new Response("Forbidden", { status: 403 });
  }
}
