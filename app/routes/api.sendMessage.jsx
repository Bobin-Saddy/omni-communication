import { json } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const action = async ({ request }) => {
  try {
    const data = await request.json();
    const { conversationId, message, customerId } = data;

    if (!message || (!conversationId && !customerId)) {
      return json({ error: "Missing required fields" }, { status: 400 });
    }

    // Try to fetch the existing chat session
    let session = null;

    if (conversationId) {
      session = await prisma.chatSession.findUnique({
        where: { id: parseInt(conversationId, 10) },
      });
    }

    // If session does not exist, create one using customerId
    if (!session) {
      session = await prisma.chatSession.create({
        data: {
          customerId: customerId, // You need to send customerId from frontend
        },
      });
    }

    // Save the chat message
    const savedMessage = await prisma.chatMessage.create({
      data: {
        conversationId: session.id,
        sender: "me", // Owner sending message
        content: message,
      },
    });

    return json({ success: true, message: savedMessage });
  } catch (err) {
    console.error("Error saving chat message:", err);
    return json({ error: "Failed to save message" }, { status: 500 });
  }
};
