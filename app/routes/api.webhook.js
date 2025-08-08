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

  if (mode && token && mode === "subscribe" && token === "EAAHvZAZB8ZCmugBPFdZCUlEs44dgjYSzHMDhQu5JT14ZAtQyB06gJ5TFJNc14Pinhlxy9e7fuw89eOnZC9noLqoRYGaU3cI8q9NTOgZB99YnZAYJvp8oCejlgP0SOZC5ZBgFoLIk8yACqR2DV9zFtumaPwfwO92ZAypaU2Nnu6zo2jBHFdfvmZCeWieOZBROaWUxuJmxtIBscdxaSI9I0OnQhsFJ9E83i8kfOYsg5ZAoTD3GONtwZDZD") {
    return new Response(challenge, { status: 200 });
  } else {
    return new Response("Forbidden", { status: 403 });
  }
}
