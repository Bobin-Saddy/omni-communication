import { json } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function loader() {
  const conversations = await prisma.chatSession.findMany({
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1
      }
    }
  });

  const users = conversations.map(conv => {
    const last = conv.messages[0] || {};
    return {
      number: conv.phone,
      name: conv.userName || `User ${conv.phone}`,
      lastMessage: last.content || "",
      lastTime: last.createdAt || null
    };
  });

  return json(users);
}
