import express from "express";

const router = express.Router();

let io;
export const setSocket = (socketInstance) => {
  io = socketInstance;
};

// Facebook Webhook verification
router.get("/", (req, res) => {
  const VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN; 
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token) {
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("✅ Facebook webhook verified");
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

// Facebook message events
router.post("/", (req, res) => {
  const body = req.body;

  if (body.object === "page") {
    body.entry.forEach((entry) => {
      entry.messaging.forEach((event) => {
        if (event.message) {
          io?.emit("newMessage", {
            platform: "facebook",
            conversationId: event.sender.id,
            message: event.message.text,
            createdAt: new Date().toISOString(),
          });
        } else {
          console.log("📩 Non-message event:", event);
        }
      });
    });
    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

export default router;
