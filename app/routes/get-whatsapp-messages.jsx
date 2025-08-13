import { json } from "@remix-run/node";
import prisma from "../db.server";

const normalize = num => String(num).replace(/\D/g, "");

export async function loader({ request }) {
  const url = new URL(request.url);
  const normalize = num => String(num).replace(/\D/g, "");
  const phoneNumber = normalize(url.searchParams.get("number"));

  // 1. Fetch from customerWhatsAppMessage
  const waMessages = await prisma.customerWhatsAppMessage.findMany({
    where: {
      OR: [
        { to: phoneNumber },
        { from: phoneNumber }
      ]
    },
    orderBy: { timestamp: "asc" }
  });

  // 2. Fetch from chatMessage (agar use kar rahe ho)
  const chatMessages = await prisma.chatMessage.findMany({
    where: { conversation: { phone: phoneNumber } },
    orderBy: { createdAt: "asc" }
  });

  // 3. Merge both
  const messages = [
    ...waMessages.map(m => ({
      message: m.message,
      timestamp: m.timestamp,
      sender: m.direction === "incoming" ? "user" : "me"
    })),
    ...chatMessages.map(m => ({
      message: m.content,
      timestamp: m.createdAt,
      sender: m.sender
    }))
  ].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  return json({ messages });
}

