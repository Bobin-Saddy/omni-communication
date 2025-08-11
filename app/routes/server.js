// server.js (Express backend)
import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN; // NEVER store in frontend
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

let messagesStore = []; // In real app, use a DB

// Webhook to receive incoming messages from WhatsApp
app.post("/webhook", (req, res) => {
  const entry = req.body.entry?.[0]?.changes?.[0]?.value;
  if (entry?.messages) {
    entry.messages.forEach(msg => {
      messagesStore.push({
        id: msg.id,
        from: msg.from,
        text: msg.text?.body || "",
        timestamp: msg.timestamp
      });
    });
  }
  res.sendStatus(200);
});

// Send WhatsApp message
app.post("/api/send-whatsapp", async (req, res) => {
  const { to, text } = req.body;
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: { body: text },
        }),
      }
    );

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// Get stored messages
app.get("/api/get-messages", (req, res) => {
  res.json({ messages: messagesStore });
});

app.listen(3001, () => console.log("Server running on port 3001"));
