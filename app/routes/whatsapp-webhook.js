// app/routes/whatsapp-webhook.js

import { saveMessage } from "./messagesStore";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { number, text } = req.body;

    // Save the message
    saveMessage(number, { sender: "User", text });

    res.status(200).send("Message received");
  } else {
    res.status(405).send("Method Not Allowed");
  }
}
