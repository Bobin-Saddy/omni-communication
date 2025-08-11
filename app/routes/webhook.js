// webhook.js
import express from "express";

const router = express.Router();

// In-memory store for messages
export let unreadMessages = [];

// Webhook verification (GET)
router.get("/", (req, res) => {
  const VERIFY_TOKEN = "12345"; // your token
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token && mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("WEBHOOK_VERIFIED");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Webhook receiver (POST)
router.post("/", (req, res) => {
  console.log("Webhook event:", JSON.stringify(req.body, null, 2));

  if (req.body.object) {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const messages = changes?.value?.messages;

    if (messages && messages.length > 0) {
      messages.forEach((msg) => {
        unreadMessages.push({
          from: msg.from,
          text: msg.text?.body || "",
          timestamp: msg.timestamp,
        });
      });
    }
    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

export default router;
