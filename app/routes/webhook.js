// webhook.js or inside your Express/Node server
 import express from 'express';
const router = express.Router();

router.post("/webhook", (req, res) => {
  const body = req.body;

  console.log("📩 Incoming Webhook:", JSON.stringify(body, null, 2));

  if (body.object) {
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messages = value?.messages;

    if (messages && messages.length > 0) {
      const message = messages[0];
      const from = message.from;
      const text = message.text?.body;

      console.log(`📬 WhatsApp Message From: ${from}`);
      console.log(`💬 Message Text: ${text}`);

      // You can now:
      // 1. Save this message to a database
      // 2. Send it to frontend via WebSocket or SSE
    }
  }

  res.sendStatus(200);
});

// Verification for webhook (first time setup)
router.get("/webhook", (req, res) => {
  const VERIFY_TOKEN = "my_verification_token"; // Use same in Meta developer portal

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token === VERIFY_TOKEN) {
    console.log("Webhook verified");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

module.exports = router;
