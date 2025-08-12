// app/routes/get-whatsapp-users.jsx
import { json } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function loader() {
  const conversations = await prisma.conversation.findMany({
    include: {
      messages: {
        orderBy: { timestamp: "desc" },
        take: 1
      }
    }
  });

  const users = conversations.map(conv => {
    const last = conv.messages[0] || {};
    return {
      number: conv.phone,
      name: conv.userName || `User ${conv.phone}`,
      lastMessage: last.text || "",
      lastTime: last.timestamp || null
    };
  });

  return json(users);
}
