// pages/api/whatsapp-webhook.js
import { saveMessage } from "./messagesStore";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const VERIFY_TOKEN = "my_verify_token";
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];
    if (mode && token && mode === "subscribe" && token === VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    } else {
      return res.sendStatus(403);
    }
  }

  if (req.method === "POST") {
    const body = req.body;

    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const messageData = changes?.value?.messages?.[0];
    const profileData = changes?.value?.contacts?.[0];

    if (messageData) {
      const from = messageData.from;
      const msg = messageData.text?.body;
      const name = profileData?.profile?.name || "Unknown";

      const formattedMsg = {
        id: messageData.id,
        from: { id: "user" },
        displayName: name,
        message: msg,
        created_time: new Date().toISOString(),
      };

      saveMessage(from, formattedMsg);
    }

    return res.status(200).send("EVENT_RECEIVED");
  }

  res.status(405).send("Method Not Allowed");
}
