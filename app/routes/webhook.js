// app/routes/webhook.js
import express from "express";

const router = express.Router();

// Store messages in memory (you can replace with DB)
let storedMessages = [];

// Verify Webhook (GET)
router.get("/webhook", (req, res) => {
  const VERIFY_TOKEN = "12345"; // your token

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token) {
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("WEBHOOK_VERIFIED");
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

// Receive messages (POST)
router.post("/webhook", (req, res) => {
  const body = req.body;

  if (body.object) {
    body.entry?.forEach(entry => {
      entry.changes?.forEach(change => {
        const messages = change.value?.messages || [];
        if (messages.length > 0) {
          storedMessages.push(...messages);
        }
      });
    });

    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

// Export so other routes can use
export { storedMessages };
export default router;
