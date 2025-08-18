import { json } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function loader({ request }) {
  try {
    const url = new URL(request.url);
    const shop = url.searchParams.get("shop");

    if (!shop) {
      return json({ sessions: [] });
    }

    const sessions = await prisma.storeChatSession.findMany({
      where: { storeDomain: shop },
      orderBy: { lastSeenAt: "desc" },
    });

    return json({ sessions });
  } catch (err) {
    console.error("Loader error", err);
    return json({ sessions: [] }); // fallback
  }
}
