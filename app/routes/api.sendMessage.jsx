import { json } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const action = async ({ request }) => {
  try {
    const data = await request.json();
    const { sessionId, storeDomain, sender, message } = data;

    if (!message) {
      return json({ error: "Message is required" }, { status: 400 });
    }
    if (!storeDomain || !sessionId) {
      return json({ error: "storeDomain and sessionId are required" }, { status: 400 });
    }

    // Check if session exists
    let session = await prisma.storeChatSession.findUnique({
      where: { sessionId },
    });

    // Create new session if not exists
    if (!session) {
      session = await prisma.storeChatSession.create({
        data: {
          sessionId,
          storeDomain,
        },
      });
    }

    // Save chat message
    const savedMessage = await prisma.storeChatMessage.create({
      data: {
        sessionId: session.sessionId,
        storeDomain,
        sender: sender || "me",
        text: message,
      },
    });

    return json({ success: true, message: savedMessage, session });
  } catch (err) {
    console.error("Error saving chat message:", err);
    return json({ error: "Failed to save message" }, { status: 500 });
  }
};
