import { json } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function loader({ request }) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId"); // get userId for widget user messages
    const shop = url.searchParams.get("shop"); // optional: filter by shop

    if (userId) {
      // Fetch messages for a specific user (widget user)
      const messages = await prisma.chatMessage.findMany({
        where: { userId: parseInt(userId) },
        orderBy: { createdAt: "asc" },
      });

      return json({ messages });
    }

    if (shop) {
      // Fetch chat sessions for a particular shop
      const sessions = await prisma.storeChatSession.findMany({
        where: { storeDomain: shop },
        orderBy: { lastSeenAt: "desc" },
      });

      return json({ sessions });
    }

    // Fallback: return all sessions
    const sessions = await prisma.storeChatSession.findMany({
      orderBy: { lastSeenAt: "desc" },
    });

    return json({ sessions });
  } catch (err) {
    console.error("Loader error:", err);
    return json({ sessions: [], messages: [] }); // fallback
  }
}
