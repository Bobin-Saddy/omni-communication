// app/routes/whatsapp-webhook.js

import { json } from "@remix-run/node";
import { saveMessage } from "./messagesStore";

export const action = async ({ request }) => {
  const body = await request.json();
  const { number, text } = body;

  if (!number || !text) {
    return json({ error: "Missing number or text" }, { status: 400 });
  }

  saveMessage(number, { sender: "User", text });

  return json({ success: true });
};
