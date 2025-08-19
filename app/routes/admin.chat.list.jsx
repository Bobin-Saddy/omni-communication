import { json } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function loader({ request }) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");   // Widget user messages
    const sessionId = url.searchParams.get("sessionId"); // Shopify session messages
    const shop = url.searchParams.get("shop");       // Shopify sessions list

    if (userId) {
      // ✅ Fetch messages for widget user
      const messages = await prisma.chatMessage.findMany({
        where: { userId: parseInt(userId) },
        orderBy: { createdAt: "asc" },
      });
      return json({ messages });
    }

    if (sessionId) {
      // ✅ Fetch messages for Shopify session
      const messages = await prisma.chatMessage.findMany({
        where: { sessionId: parseInt(sessionId) },
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
