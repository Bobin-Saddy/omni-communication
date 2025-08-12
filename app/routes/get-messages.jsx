import { json } from "@remix-run/node";
import { messageStore } from "./app.messageStore";

export async function loader({ request }) {
  const url = new URL(request.url);
  const number = url.searchParams.get("number");

  if (!number) return json({ messages: [] });

  return json({ messages: messageStore[number] || [] });
}