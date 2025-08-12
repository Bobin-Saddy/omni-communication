import { json } from "@remix-run/node";
import prisma from "../db.server";

export async function loader({ request }) {
  const url = new URL(request.url);
  const phoneNumber = url.searchParams.get("number");

  if (!phoneNumber) {
    return json({ error: "Phone number is required" }, { status: 400 });
  }

  // Find chat session by phone (phone must exist in ChatSession)
  const session = await prisma.chatSession.findFirst({
    where: { phone: phoneNumber },
    select: { id: true },
  });

  if (!session) {
    // No chat session found, return empty messages
    return json({ messages: [] });
  }

  // Fetch all messages for this session
  const messages = await prisma.chatMessage.findMany({
    where: { conversationId: session.id },
    orderBy: { createdAt: "asc" },
  });

  return json({ messages });
}
