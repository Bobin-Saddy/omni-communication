import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const VERIFY_TOKEN = "12345";
const BUSINESS_NUMBER = "106660072463312"; // your business WhatsApp number

const normalize = num => String(num).replace(/\D/g, "");

export async function loader({ request }) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }
  return new Response("Verification failed", { status: 403 });
}

// webhook.whatsapp.jsx
export async function action({ request }) {
  try {
    const data = await request.json();
    const { number, text, sender } = data;

    if (!number || !text) {
      return new Response(
        JSON.stringify({ ok: false, error: "Missing number or text" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 1. Send message to WhatsApp Cloud API
    const resp = await fetch(
      `https://graph.facebook.com/v21.0/${BUSINESS_NUMBER}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: number,
          text: { body: text },
        }),
      }
    );

    const apiResp = await resp.json();
    if (!resp.ok) {
      console.error("WhatsApp API error:", apiResp);
      throw new Error(apiResp.error?.message || "Failed to send message");
    }

    // 2. Save locally as outgoing
    const message = await prisma.customerWhatsAppMessage.create({
      data: {
        from: "me",
        to: number,
        message: text,
        timestamp: new Date(),
        direction: "outgoing",
      },
    });

    return new Response(
      JSON.stringify({
        ok: true,
        message: {
          id: message.id,
          text: message.message,
          createdAt: message.timestamp,
          sender: "me",
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error sending outgoing WhatsApp message:", err);
    return new Response(
      JSON.stringify({ ok: false, error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

