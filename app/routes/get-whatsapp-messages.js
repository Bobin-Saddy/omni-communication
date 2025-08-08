// pages/api/get-messages.js
import { getMessages } from "./messagesStore";

export default function handler(req, res) {
  const number = req.query.number;
  if (!number) {
    return res.status(400).json({ error: "Missing number" });
  }

  const messages = getMessages(number);
  res.status(200).json({ messages });
}
