import express from "express";
import bodyParser from "body-parser";
import pkg from "ws";

const { WebSocketServer } = pkg;

const app = express();
app.use(bodyParser.json());

const wss = new WebSocketServer({ port: 8080 });
let clients = [];

wss.on("connection", (ws) => {
  clients.push(ws);
  ws.on("close", () => {
    clients = clients.filter((c) => c !== ws);
  });
});

/**
 * Handle GET (Meta webhook verification)
 */
export async function loader({ request }) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  const VERIFY_TOKEN = "mysecretverifytoken123"; // replace with env var

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

/**
 * Handle POST (incoming webhook events from Meta)
 */
export async function action({ request }) {
  try {
    const body = await request.json();
    const entry = body.entry?.[0];
    const message = entry?.messaging?.[0];

    if (message) {
      // Broadcast message to all WebSocket clients
      clients.forEach((ws) => {
        ws.send(
          JSON.stringify({
            type: "fb_message",
            data: message,
          })
        );
      });
    }

    return json({ status: "ok" }, { status: 200 });
  } catch (err) {
    console.error("Webhook error:", err);
    return json({ error: "Webhook failed" }, { status: 500 });
  }
}
