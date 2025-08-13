import { json } from "@remix-run/node";
import prisma from "../db.server";

const normalize = num => String(num).replace(/\D/g, "");

export async function loader({ request }) {
  const url = new URL(request.url);
  const phoneNumber = normalize(url.searchParams.get("number"));

  const outgoingMessages = await prisma.customerWhatsAppMessage.findMany({
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

  const incomingMessages = await prisma.chatMessage.findMany({
    where: { conversation: { phone: phoneNumber } },
    select: {
      content: true,
      createdAt: true,
      sender: true,
    }
  });

  const messages = [
    ...outgoingMessages.map(m => ({
      message: m.message,
      timestamp: m.timestamp,
      sender: m.direction === "incoming" ? "user" : "me"
    })),
    ...incomingMessages.map(m => ({
      message: m.content,
      timestamp: m.createdAt,
      sender: m.sender
    }))
  ].sort((a, b) => a.timestamp - b.timestamp);

  return json({ messages });
}
