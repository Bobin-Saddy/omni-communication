import { json } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function loader({ request }) {
  const url = new URL(request.url);
  const number = url.searchParams.get("number");

  if (!number) {
    return json({ messages: [] });
  }

  // Normalize number (remove + or spaces)
  const phoneNumber = number.replace(/\D/g, "");

  const whatsappMessages = await prisma.customerWhatsAppMessage.findMany({
    where: {
      OR: [
        { to: phoneNumber },
        { from: phoneNumber }
      ]
    },
    orderBy: { timestamp: "asc" }
  });

  // Convert to UI format
  const messages = whatsappMessages.map(m => ({
    content: m.message,
    sender: m.direction === "incoming" ? "user" : "me",
    timestamp: m.timestamp
  }));

  return json({ messages });
}
