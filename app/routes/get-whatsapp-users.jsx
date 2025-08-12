import { json } from "@remix-run/node";
import { messageStore } from "./app.messageStore";

export async function loader() {
  // messageStore looks like: { "919876543210": [ {...msg}, {...msg} ], ... }
  const users = Object.keys(messageStore).map((number) => {
    const latestMsg = messageStore[number]?.[messageStore[number].length - 1];
    return {
      number,
      name: latestMsg?.profile?.name || `WhatsApp User ${number}`, // if you ever store profile name
      lastMessage: latestMsg?.message || "",
      lastTime: latestMsg?.created_time || null
    };
  });

  return json(users);
}
