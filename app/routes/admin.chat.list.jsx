import { json } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// backend: /admin/chat/list
export async function loader({ request }) {
  try {
    const url = new URL(request.url);
    const conversationId = url.searchParams.get("conversationId");
    const shop = url.searchParams.get("shop");
    const userId = url.searchParams.get("userId"); // ✅ new param

    if (conversationId) {
      const messages = await prisma.chatMessage.findMany({
        where: { conversationId: parseInt(conversationId) },
        orderBy: { createdAt: "asc" },
      });
      return json({ messages });
    }

    if (userId) {
      // ✅ fetch all conversations & messages of this user
      const sessions = await prisma.storeChatSession.findMany({
        where: { userId: parseInt(userId) },
        include: {
          messages: { orderBy: { createdAt: "asc" } },
        },
      });

      return json({ sessions });
    }

    if (shop) {
      const sessions = await prisma.storeChatSession.findMany({
        where: { storeDomain: shop },
        orderBy: { lastSeenAt: "desc" },
      });
      return json({ sessions });
    }

    const sessions = await prisma.storeChatSession.findMany({
      orderBy: { lastSeenAt: "desc" },
    });

    return json({ sessions });
  } catch (err) {
    console.error("Loader error:", err);
    return json({ sessions: [], messages: [] });
  }
}

