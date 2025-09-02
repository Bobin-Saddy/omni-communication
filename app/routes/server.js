// server.js
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import facebookWebhook, { setSocket } from "./webhook.facebook";

const app = express();

// HTTP server wrap
const server = createServer(app);

// Socket.IO config
const io = new Server(server, {
  cors: {
    origin: "https://seo-partner.myshopify.com", // tumhara frontend domain
    methods: ["GET", "POST"],
  },
});

// Pass socket.io instance to webhook
setSocket(io);

// Webhook route
app.use("/webhook/facebook", facebookWebhook);

// Test route (optional)
app.get("/", (req, res) => {
  res.send("🚀 Server is live on Heroku");
});

// Start server
server.listen(process.env.PORT || 3000, () =>
  console.log("✅ Server running with socket.io")
);
