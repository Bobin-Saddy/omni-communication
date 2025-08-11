// api.js
import express from "express";
import fetch from "node-fetch";
import { unreadMessages } from "./webhook";

const router = express.Router();

// Send WhatsApp message
router.post("/send-whatsapp", async (req, res) => {
  try {
    const { to, message } = req.body;
    const token = process.env.WHATSAPP_TOKEN; // store in env
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          text: { body: message },
        }),
      }
    );

    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    console.error("Error sending WhatsApp:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get unread messages
router.get("/get-messages", (req, res) => {
  res.json({ messages: unreadMessages });
});

export default router;
