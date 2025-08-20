import { json } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function loader({ request }) {
  try {
    const url = new URL(request.url);
    const conversationId = url.searchParams.get("conversationId"); // for internal chat
    const sessionId = url.searchParams.get("sessionId"); // for store/widget chat
    const shop = url.searchParams.get("shop"); // filter sessions by shop

    // ✅ Internal chat system
    if (conversationId) {
      const convId = parseInt(conversationId, 10);
      if (isNaN(convId)) return json({ messages: [] });

      const messages = await prisma.chatMessage.findMany({
        where: { conversationId: convId },
        orderBy: { createdAt: "asc" },
      });

      return json({ messages });
    }

    // ✅ Store chat system (widget, FB, IG, WA…)
    if (sessionId) {
      const messages = await prisma.storeChatMessage.findMany({
        where: { sessionId },
        orderBy: { createdAt: "asc" },
      });

      return json({ messages });
    }

    // ✅ Fetch sessions for a specific shop
    if (shop) {
      const sessions = await prisma.storeChatSession.findMany({
        where: { storeDomain: shop },
        orderBy: { lastSeenAt: "desc" },
      });

      return json({ sessions });
    }

    // ✅ Default: return all store sessions
    const sessions = await prisma.storeChatSession.findMany({
      orderBy: { lastSeenAt: "desc" },
    });

    return json({ sessions });
  } catch (err) {
    console.error("Loader error:", err);
    return json({ sessions: [], messages: [] }); // fallback
  }
}
