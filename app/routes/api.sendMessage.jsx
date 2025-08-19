import { json } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();


export const action = async ({ request }) => {
  try {
    const data = await request.json();
    const { conversationId, message } = data;

// server side
const conversation = await prisma.conversation.findUnique({
  where: { id: parseInt(conversationId, 10) },
});

if (!conversation) {
  return json({ error: "Conversation not found" }, { status: 400 });
}

await prisma.chatMessage.create({
  data: {
    conversationId: conversation.id,
    sender: "me",
    content: message,
  },
});


    return json({ success: true, message: savedMessage });
  } catch (err) {
    console.error("Error saving chat message:", err);
    return json({ error: "Failed to save message" }, { status: 500 });
  }
};