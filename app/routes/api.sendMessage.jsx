import { json } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const action = async ({ request }) => {
  try {
    const data = await request.json();
    const { conversationId, customerId, message } = data;

    if (!message || (!conversationId && !customerId)) {
      return json({ error: "Message or customerId is missing" }, { status: 400 });
    }

    let session = null;

    // If conversationId exists, find it
    if (conversationId) {
      session = await prisma.chatSession.findUnique({
        where: { id: parseInt(conversationId, 10) },
      });
    }

    // If no session, create new one using customerId
    if (!session) {
      if (!customerId) {
        return json({ error: "CustomerId is required to create a conversation" }, { status: 400 });
      }

      session = await prisma.chatSession.create({
        data: { customerId: parseInt(customerId, 10) },
      });
    }

    const savedMessage = await prisma.chatMessage.create({
      data: {
        conversationId: session.id,
        sender: "me",
        content: message,
      },
    });

    return json({ success: true, message: savedMessage, conversation: session });
  } catch (err) {
    console.error("Error saving chat message:", err);
    return json({ error: "Failed to save message" }, { status: 500 });
  }
};
