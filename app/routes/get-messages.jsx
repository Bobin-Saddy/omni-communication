// app/routes/get-messages.jsx
import { json } from "@remix-run/node";
import prisma from "../db.server";

export async function loader({ request }) {
  const url = new URL(request.url);
  const phoneNumber = url.searchParams.get("number");

  if (!phoneNumber) {
    return json({ error: "Phone number is required" }, { status: 400 });
  }

  // 1️⃣ Find the chat session linked to this phone number
  const session = await prisma.chatSession.findFirst({
    where: {
      contacts: {
        some: {
          phone: phoneNumber,
        },
      },
    },
    select: {
      id: true,
    },
  });

  if (!session) {
    return json({ messages: [] }); // No chat session found
  }

  // 2️⃣ Fetch all messages for that conversation ID
  const messages = await prisma.chatMessage.findMany({
    where: { conversationId: session.id },
    orderBy: { createdAt: "asc" },
  });

  return json({ messages });
}
