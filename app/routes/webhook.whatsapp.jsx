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

export async function action({ request }) {
  const body = await request.json();
  const entry = body?.entry?.[0]?.changes?.[0]?.value;

  // ✅ Handle INCOMING messages
  const messages = entry?.messages;
  if (messages && messages.length > 0) {
    const msg = messages[0];
    const from = normalize(msg.from);
    const text = msg?.text?.body || "";
    const name = msg?.profile?.name || "";

    await prisma.customerWhatsAppMessage.create({
      data: {
        from,
        to: BUSINESS_NUMBER,
        message: text,
        direction: "incoming", // ✅ incoming
        timestamp: new Date(),
      },
    });

    await prisma.chatSession.upsert({
      where: { phone: from },
      update: {
        messages: {
          create: { content: text, sender: "user" },
        },
      },
      create: {
        userId: from,
        userName: name,
        phone: from,
        messages: {
          create: { content: text, sender: "user" },
        },
      },
    });

    console.log("📩 Stored incoming WhatsApp message:", from, text);
  }

  // ✅ Handle OUTGOING message statuses (your sent messages)
  const statuses = entry?.statuses;
  if (statuses && statuses.length > 0) {
    const status = statuses[0];
    const to = normalize(status.recipient_id);

    await prisma.customerWhatsAppMessage.create({
      data: {
        from: BUSINESS_NUMBER,
        to,
        message: status?.status || "Message sent",
        direction: "outgoing", // ✅ outgoing
        timestamp: new Date(),
      },
    });

    console.log("📤 Stored outgoing WhatsApp status:", to, status.status);
  }

  return new Response("EVENT_RECEIVED", { status: 200 });
}
