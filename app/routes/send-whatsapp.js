// app/routes/send-whatsapp.js
import express from "express";
import fetch from "node-fetch";

const router = express.Router();

router.post("/send-whatsapp", async (req, res) => {
  const { phoneNumberId, recipient, message } = req.body;

  try {
    const response = await fetch(
      `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.WHATSAPP_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: recipient,
          text: { body: message }
        })
      }
    );

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

export default router;
