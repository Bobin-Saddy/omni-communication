// app/routes/get-messages.js
import express from "express";

let storedMessages = [];

export function storeWhatsAppMessage(message) {
  storedMessages.push(message);
}

const router = express.Router();

router.get("/get-messages", (req, res) => {
  res.json({ messages: storedMessages });
});

export default router;
