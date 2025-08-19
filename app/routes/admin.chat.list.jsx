import { json } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function loader({ params }) {
  const { sessionId } = params;

  if (!sessionId) return json({ messages: [] });

  const messages = await prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
  });

  return json({ messages });
}
