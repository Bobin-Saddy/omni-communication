import { json } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();


export const action = async ({ request }) => {
  try {
    const data = await request.json();
    const { conversationId, message } = data;

    if (!conversationId || !message) {
      return json({ error: "Missing conversationId or message" }, { status: 400 });
    }

    const savedMessage = await prisma.chatMessage.create({
      data: {
        conversationId: parseInt(conversationId, 10),
        sender: "me",
        message,
      },
    });

    return json({ success: true, message: savedMessage });
  } catch (err) {
    console.error("Error saving chat message:", err);
    return json({ error: "Failed to save message" }, { status: 500 });
  }
};
