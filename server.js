import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import facebookWebhook, { setSocket } from "./webhook.facebook.js";

const app = express();
app.use(express.json());

const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "https://seo-partner.myshopify.com",
      "https://omnichannel-communication-3d7329b35a37.herokuapp.com"
    ],
    methods: ["GET", "POST"],
  },
});

setSocket(io);
app.use("/webhook/facebook", facebookWebhook);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`✅ Server running on ${PORT}`));
