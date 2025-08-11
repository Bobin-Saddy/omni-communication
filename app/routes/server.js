const express = require("express");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

let whatsappMessages = {}; // store in memory (DB recommended for production)

// WhatsApp webhook endpoint
app.post("/webhook/whatsapp", (req, res) => {
  const entry = req.body.entry?.[0];
  const changes = entry?.changes || [];

  changes.forEach(change => {
    const value = change.value || {};
    value.messages?.forEach(message => {
      const from = message.from;
      const text = message.text?.body || "";
      const time = new Date(Number(message.timestamp) * 1000).toISOString();

      if (!whatsappMessages[from]) whatsappMessages[from] = [];
      whatsappMessages[from].push({
        id: Date.now().toString(),
        from,
        text,
        created_time: time,
      });
    });
  });

  res.sendStatus(200);
});

// API for React frontend to get conversations
app.get("/index", (req, res) => {
  const users = Object.keys(whatsappMessages).map(num => ({
    id: num,
    type: "whatsapp",
    name: num,
    messages: whatsappMessages[num],
  }));
  res.json(users);
});

app.listen(5000, () => console.log("Server running on port 5000"));
