import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import facebookWebhook, { setSocket } from "./app/routes/webhook.facebook.js";
// If you use Remix, import it here
// import { createRequestHandler } from "@remix-run/express";

const app = express();
app.use(express.json());

const server = createServer(app);

// ✅ Socket.io init
const io = new Server(server, {
  cors: {
    origin: [
      "https://seo-partner.myshopify.com",
      "https://omnichannel-communication-3d7329b35a37.herokuapp.com",
    ],
    methods: ["GET", "POST"],
  },
});

// ✅ Pass io into webhook
setSocket(io);

// ✅ Health check
app.get("/", (req, res) => {
  res.send("🚀 Omnichannel server running");
});

// ✅ Webhook
app.use("/webhook/facebook", facebookWebhook);

// ✅ Mount Remix last, but exclude `/socket.io/*`
// app.all(
//   "*",
//   (req, res, next) => {
//     if (req.path.startsWith("/socket.io")) return next(); // let socket.io handle
//     return createRequestHandler({
//       build: require("./build"), // adjust path if needed
//       mode: process.env.NODE_ENV,
//     })(req, res, next);
//   }
// );

const PORT = process.env.PORT || 3000;
server.listen(PORT, () =>
  console.log(`✅ Server + Socket.io running on port ${PORT}`)
);
