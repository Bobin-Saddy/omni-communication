// app/routes/get-messages.jsx
import { json } from "@remix-run/node";
import prisma from "../db.server";

const normalize = (num) => {
  if (!num) return "";
  return String(num).replace(/\D/g, ""); // keep only digits
};

export async function loader({ request }) {
  try {
    const url = new URL(request.url);
    const rawNumber = url.searchParams.get("number");
    const phoneNumber = normalize(rawNumber);

    console.log("Incoming raw number:", rawNumber);
    console.log("Normalized number:", phoneNumber);

    if (!phoneNumber) {
      return json({ error: "Phone number is required" }, { status: 400 });
    }

    // ---- 1️⃣ ChatSession messages ----
    let chatSessionMessages = [];
    const session = await prisma.chatSession.findFirst({
      where: { phone: phoneNumber },
      select: { id: true },
    });

    if (session) {
      chatSessionMessages = await prisma.chatMessage.findMany({
        where: { conversationId: session.id },
        orderBy: { createdAt: "asc" },
        select: {
          content: true,
          createdAt: true,
          sender: true,
        },
      });
    }

    // ---- 2️⃣ WhatsApp messages ----
    const whatsappMessages = await prisma.customerWhatsAppMessage.findMany({
      where: {
        OR: [
          { to: phoneNumber },
          { from: phoneNumber },
        ],
      },
      orderBy: { timestamp: "asc" },
      select: {
        message: true,
        timestamp: true,
        direction: true,
      },
    });

    // ---- 3️⃣ Format both sources ----
    const formattedWhatsApp = whatsappMessages.map((m) => ({
      content: m.message,
      sender: m.direction === "incoming" ? "user" : "me",
      timestamp: m.timestamp,
    }));

    const formattedChatSession = chatSessionMessages.map((m) => ({
      content: m.content,
      sender: m.sender,
      timestamp: m.createdAt,
    }));

    // ---- 4️⃣ Merge & sort ----
    const allMessages = [...formattedWhatsApp, ...formattedChatSession].sort(
      (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    );

    return json({ messages: allMessages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return json({ error: "Failed to fetch WhatsApp messages" }, { status: 500 });
  }
}
