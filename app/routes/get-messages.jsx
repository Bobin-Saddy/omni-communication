// app/routes/get-messages.jsx
import { json } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Example Remix loader
// Inside /get-messages route loader
export async function loader({ request }) {
  const url = new URL(request.url);
  const phoneNumber = url.searchParams.get("number");

  if (!phoneNumber) {
    throw new Error("Phone number is required");
  }

  // 1️⃣ Find the conversation for that phone
  const conversation = await prisma.chatSession.findUnique({
    where: { phone: phoneNumber },
    select: { id: true },
  });

  if (!conversation) {
    return []; // No conversation found
  }

  // 2️⃣ Get the messages for that conversationId
  const messages = await prisma.chatMessage.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "asc" },
  });

  return messages;
}
