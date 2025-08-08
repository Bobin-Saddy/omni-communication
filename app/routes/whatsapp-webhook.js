// pages/api/whatsapp-webhook.js
export default async function handler(req, res) {
  if (req.method === "GET") {
    const VERIFY_TOKEN = "my_verify_token";

    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode && token) {
      if (mode === "subscribe" && token === VERIFY_TOKEN) {
        console.log("Webhook verified");
        return res.status(200).send(challenge);
      } else {
        return res.sendStatus(403);
      }
    }
  }

  if (req.method === "POST") {
    const body = req.body;

    if (body.object) {
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const messageData = changes?.value?.messages?.[0];

      if (messageData) {
        const from = messageData.from; // phone number
        const msg = messageData.text?.body;

        console.log("📥 WhatsApp Message Received:");
        console.log("From:", from);
        console.log("Message:", msg);

        // TODO: Save to DB or broadcast to frontend
      }

      return res.status(200).send("EVENT_RECEIVED");
    }

    return res.sendStatus(404);
  }

  return res.sendStatus(405); // Method not allowed
}
