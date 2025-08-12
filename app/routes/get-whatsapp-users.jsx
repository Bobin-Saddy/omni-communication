import { json } from "@remix-run/node";
import { messageStore } from "./app.messageStore";

export async function loader() {
  const users = Object.keys(messageStore).map((number) => {
    const msgs = messageStore[number];
    const last = msgs[msgs.length - 1] || {};
    return {
      number,
      name: last.profile?.name || `User ${number}`,
      lastMessage: last.message || "",
      lastTime: last.timestamp || null
    };
  });
  return json(users);
}