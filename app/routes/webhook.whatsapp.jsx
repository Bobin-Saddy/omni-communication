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
  const messages = body?.entry?.[0]?.changes?.[0]?.value?.messages;

  if (messages && messages.length > 0) {
    const msg = messages[0];
    const from = normalize(msg.from);
    const text = msg?.text?.body || "";
    const name = msg?.profile?.name || "";

    // Save to customerWhatsAppMessage
 await prisma.customerWhatsAppMessage.create({
  data: {
    to: activeConversation.userNumber,
    from: BUSINESS_NUMBER,
    message: text,
    direction: "outgoing",
    timestamp: new Date(),
  },
});


    // (Optional) still maintain chatSession + chatMessage if needed by other parts of app
    await prisma.chatSession.upsert({
      where: { phone: from },
      update: {
        messages: {
          create: {
            content: text,
            sender: "user",
          },
        },
      },
      create: {
        userId: from,
        userName: name,
        phone: from,
        messages: {
          create: {
            content: text,
            sender: "user",
          },
        },
      },
    });

    console.log("Stored incoming WhatsApp message from", from, text);
  }

  return new Response("EVENT_RECEIVED", { status: 200 });
}
