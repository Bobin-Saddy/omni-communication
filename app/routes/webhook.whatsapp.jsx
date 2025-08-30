// routes/webhook.whatsapp.jsx
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const VERIFY_TOKEN = "12345";
const BUSINESS_NUMBER = "106660072463312"; // your business WhatsApp number

const normalize = (num) => String(num).replace(/\D/g, "");

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

export async function action({ request }) {
  try {
    const body = await request.json();
    const messages = body?.entry?.[0]?.changes?.[0]?.value?.messages;

    if (messages && messages.length > 0) {
      const msg = messages[0];

      // ✅ Only handle text messages
      if (msg.type !== "text" || !msg.text?.body) {
        return new Response("EVENT_RECEIVED", { status: 200 });
      }

      const from = normalize(msg.from);
      const text = msg.text.body;
      const name = msg?.profile?.name || "";

      // 🔹 Dedup check by platformMessageId
      const existing = await prisma.customerWhatsAppMessage.findUnique({
        where: { platformMessageId: msg.id },
      });
      if (existing) {
        return new Response("EVENT_RECEIVED", { status: 200 });
      }

      // 🔹 Save INCOMING user message
      await prisma.customerWhatsAppMessage.create({
        data: {
          from,
          to: BUSINESS_NUMBER,
          message: text,
          direction: "incoming",
          timestamp: new Date(),
          platformMessageId: msg.id,
        },
      });

      // 🔹 Update or create chat session
      await prisma.chatSession.upsert({
        where: { phone: from },
        update: {
          messages: { create: { content: text, sender: "them" } }, // 🔑 normalize sender
        },
        create: {
          userId: from,
          userName: name,
          phone: from,
          messages: { create: { content: text, sender: "them" } }, // keep sender consistent
        },
      });

      console.log("📥 Stored incoming WhatsApp message from", from, text);
    }

    return new Response("EVENT_RECEIVED", { status: 200 });
  } catch (err) {
    console.error("Error in WhatsApp webhook:", err);
    return new Response("SERVER_ERROR", { status: 500 });
  }
}
