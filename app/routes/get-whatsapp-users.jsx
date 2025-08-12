import { json } from "@remix-run/node";
import { messageStore } from "./app.messageStore";

export async function loader() {
  // messageStore is an object: { "919876543210": [ {...}, {...} ], ... }
  const users = Object.keys(messageStore).map((number) => {
    const messages = messageStore[number];
    const lastMessage = messages[messages.length - 1] || {};

    return {
      number,
      name: lastMessage?.profile?.name || `WhatsApp User ${number}`,
      lastMessage: lastMessage?.message || "",
      lastTime: lastMessage?.timestamp || null
    };
  });

  return json(users);
}
