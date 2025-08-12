// app/routes/get-messages.jsx
import { json } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Example Remix loader
export async function loader({ params }) {
  const { id } = params; // ChatSession ID
  const messages = await prisma.chatMessage.findMany({
    where: { conversationId: Number(id) },
    orderBy: { createdAt: "asc" },
  });
  return json(messages);
}

