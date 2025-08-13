import { json } from "@remix-run/node";
import prisma from "../db.server";

export async function loader({ request }) {
  const url = new URL(request.url);
  const normalize = num => String(num).replace(/\D/g, "");
  const phoneNumber = normalize(url.searchParams.get("number"));

  // WhatsApp table se messages (incoming + outgoing)
  const whatsappMessages = await prisma.customerWhatsAppMessage.findMany({
    where: {
      OR: [{ to: phoneNumber }, { from: phoneNumber }]
    },
    select: {
      message: true,
      timestamp: true,
      from: true,
      to: true,
      direction: true,
    }
  });

  // Chat messages table se incoming messages
  const chatMessages = await prisma.chatMessage.findMany({
    where: { conversation: { phone: phoneNumber } },
    select: {
      content: true,
      createdAt: true,
      sender: true,
    }
  });

  // Merge and sort
  const messages = [
    ...whatsappMessages.map(m => ({
      message: m.message,
      timestamp: m.timestamp,
      sender: m.direction === "incoming" ? "user" : "me"
    })),
    ...chatMessages.map(m => ({
      message: m.content,
      timestamp: m.createdAt,
      sender: m.sender
    }))
  ].sort((a, b) => a.timestamp - b.timestamp);

  return json({ messages });
}
