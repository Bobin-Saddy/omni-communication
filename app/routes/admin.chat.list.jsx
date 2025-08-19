import { json } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function loader({ request }) {
  try {
    const url = new URL(request.url);
    const conversationId = url.searchParams.get("conversationId"); // messages for a chat session
    const shop = url.searchParams.get("shop"); // filter sessions by shop

    if (conversationId) {
      // ✅ Fetch messages for a specific conversation
      const messages = await prisma.chatMessage.findMany({
        where: { conversationId: parseInt(conversationId) },
        orderBy: { createdAt: "asc" },
      });

      return json({ messages });
    }

    if (shop) {
      // ✅ Fetch chat sessions for a particular shop
      const sessions = await prisma.storeChatSession.findMany({
        where: { storeDomain: shop },
        orderBy: { lastSeenAt: "desc" },
      });

      return json({ sessions });
    }

    // ✅ Default: return all sessions
    const sessions = await prisma.storeChatSession.findMany({
      orderBy: { lastSeenAt: "desc" },
    });

    return json({ sessions });
  } catch (err) {
    console.error("Loader error:", err);
    return json({ sessions: [], messages: [] }); // fallback
  }
}
