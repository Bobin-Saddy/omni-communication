// In-memory store for WhatsApp messages
export let storedMessages = [];

// Webhook handler
export default async function webhookHandler(req, res) {
  if (req.method === "GET") {
    // Webhook verification
    const VERIFY_TOKEN = "12345"; // your webhook token
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode && token) {
      if (mode === "subscribe" && token === VERIFY_TOKEN) {
        console.log("WEBHOOK_VERIFIED");
        return res.status(200).send(challenge);
      } else {
        return res.sendStatus(403);
      }
    }
  } else if (req.method === "POST") {
    // Incoming message from WhatsApp Cloud API
    const body = req.body;

    console.log("Incoming webhook:", JSON.stringify(body, null, 2));

    if (
      body.object &&
      body.entry &&
      body.entry[0].changes &&
      body.entry[0].changes[0].value.messages &&
      body.entry[0].changes[0].value.messages[0]
    ) {
      const message = body.entry[0].changes[0].value.messages[0];
      storedMessages.push(message);
    }

    return res.sendStatus(200);
  } else {
    return res.sendStatus(405);
  }
}
