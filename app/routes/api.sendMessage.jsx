import { json } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const action = async ({ request }) => {
  try {
    const data = await request.json();
    const { conversationId, message } = data;

    // Use ChatSession (not Conversation)
    const session = await prisma.chatSession.findUnique({
      where: { id: parseInt(conversationId, 10) },
    });

    if (!session) {
      return json({ error: "Conversation not found" }, { status: 400 });
    }

    const savedMessage = await prisma.chatMessage.create({
      data: {
        conversationId: session.id,
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
