import express from "express";
const router = express.Router();

let unreadMessages = {}; // Facebook message tracking
let whatsappMessages = []; // Store WhatsApp incoming messages

router.post("/webhook", (req, res) => {
  const body = req.body;

  // 👉 Handle WhatsApp messages
  if (body.object === "whatsapp_business_account") {
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messages = value?.messages;

    if (messages && messages.length > 0) {
      const message = messages[0];
      const from = message.from;
      const text = message.text?.body;

      whatsappMessages.push({
        id: message.id,
        from,
        text,
        timestamp: new Date().toISOString(),
      });

      console.log("📩 WhatsApp Message:", text);
    }

    return res.sendStatus(200);
  }

  // 👉 Handle Facebook messages
  if (body.object === "page") {
    body.entry.forEach(function (entry) {
      const messaging = entry.messaging[0];
      const senderId = messaging.sender.id;
      const recipientId = messaging.recipient.id;
      const message = messaging.message;

      if (message && senderId !== 544704651303656) {
        const conversationId = senderId;

        if (!unreadMessages[conversationId]) {
          unreadMessages[conversationId] = 0;
        }

        unreadMessages[conversationId] += 1;
      }
    });

    return res.status(200).send("EVENT_RECEIVED");
  }

  // For any other type
  return res.sendStatus(404);
});

// 📥 Endpoint to fetch WhatsApp messages (frontend will call this)
router.get("/messages", (req, res) => {
  res.json(whatsappMessages);
});

// ✅ Verification route (required by Meta)
router.get("/webhook", (req, res) => {
  const VERIFY_TOKEN = "my_verification_token"; // set this same in Meta Developer Portal

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token === VERIFY_TOKEN) {
    console.log("✅ Webhook verified!");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

export { unreadMessages, whatsappMessages };
export default router;
