import { storedMessages } from "./webhook.js";

export default function handler(req, res) {
  return res.json({ messages: storedMessages });
}
