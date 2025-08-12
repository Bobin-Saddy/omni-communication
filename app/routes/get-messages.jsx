// app/routes/get-messages.jsx
import { json } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Example Remix loader
export async function loader({ request }) {
  const url = new URL(request.url);
  const phone = url.searchParams.get("number");

  // 1. Find the conversation for that phone
  const conversation = await prisma.chatSession.findUnique({
    where: { phone },
    select: { id: true }
  });

  if (!conversation) {
    return json([]); // No messages if conversation doesn't exist
  }

  // 2. Fetch messages for that conversationId
  const messages = await prisma.chatMessage.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "asc" }
  });

  return json(messages);
}
