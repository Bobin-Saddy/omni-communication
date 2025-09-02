// server.js
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import facebookWebhook, { setSocket } from "./app/routes/webhook.facebook.js";

const app = express();
app.use(express.json());

// Create HTTP server
const server = createServer(app);

// Initialize Socket.io with CORS
const io = new Server(server, {
  cors: {
    origin: [
      "https://seo-partner.myshopify.com",
      "https://omnichannel-communication-3d7329b35a37.herokuapp.com"
    ],
    methods: ["GET", "POST"],
  },
});

// Pass io to webhook
setSocket(io);

// ✅ Health check route
app.get("/", (req, res) => {
  res.send("🚀 Omnichannel Communication Server is running");
});

// ✅ Facebook webhook route
app.use("/webhook/facebook", facebookWebhook);

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
