import { json } from "@remix-run/node";
import { prisma } from "../db.server";

export const action = async ({ request }) => {
  const data = await request.json();
  const { conversationId, message } = data;

  if (!conversationId || !message) {
    return json({ error: "Missing conversationId or message" }, { status: 400 });
  }

  try {
    await prisma.chatMessage.create({
      data: {
        conversationId: parseInt(conversationId),
        sender: "me",
        message,
      },
    });

    return json({ success: true });
  } catch (err) {
    console.error(err);
    return json({ error: "Failed to save message" }, { status: 500 });
  }
};
