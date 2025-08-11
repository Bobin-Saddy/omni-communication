// app/routes/webhook.js
import express from "express";

const router = express.Router();
let unreadMessages = [];

router.get("/webhook", (req, res) => {
  const verifyToken = "12345"; // your token
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token) {
    if (mode === "subscribe" && token === verifyToken) {
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

router.post("/webhook", (req, res) => {
  const body = req.body;

  if (body.object) {
    body.entry.forEach(entry => {
      const changes = entry.changes || [];
      changes.forEach(change => {
        const messageData = change.value?.messages || [];
        unreadMessages.push(...messageData);
      });
    });
    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

// Export the messages array so other files can access it
export { unreadMessages };
export default router;
