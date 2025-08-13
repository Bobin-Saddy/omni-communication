import { json } from "@remix-run/node";
import prisma from "../db.server";

const normalize = num => String(num).replace(/\D/g, "");

export async function loader({ request }) {
  const url = new URL(request.url);
  const phoneNumber = normalize(url.searchParams.get("number"));

  if (!phoneNumber) {
    return json({ error: "Phone number is required" }, { status: 400 });
  }

  // 1️⃣ ChatSession ke messages fetch karo
  const session = await prisma.chatSession.findFirst({
    where: { phone: phoneNumber },
    select: { id: true },
  });

  let chatSessionMessages = [];
  if (session) {
    chatSessionMessages = await prisma.chatMessage.findMany({
      where: { conversationId: session.id },
      orderBy: { createdAt: "asc" },
      select: {
        content: true,
        createdAt: true,
        sender: true,
      },
    });
  }

  // 2️⃣ WhatsApp messages fetch karo
  const whatsappMessages = await prisma.customerWhatsAppMessage.findMany({
    where: {
      OR: [
        { to: phoneNumber },
        { from: phoneNumber }
      ]
    },
    orderBy: { timestamp: "asc" },
    select: {
      message: true,
      timestamp: true,
      direction: true,
    }
  });

  // 3️⃣ Format dono sources ka data
  const formattedWhatsApp = whatsappMessages.map(m => ({
    content: m.message,
    sender: m.direction === "incoming" ? "user" : "me",
    timestamp: m.timestamp
  }));

  const formattedChatSession = chatSessionMessages.map(m => ({
    content: m.content,
    sender: m.sender,
    timestamp: m.createdAt
  }));

  // 4️⃣ Merge + sort
  const allMessages = [...formattedWhatsApp, ...formattedChatSession]
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  return json({ messages: allMessages });
}
