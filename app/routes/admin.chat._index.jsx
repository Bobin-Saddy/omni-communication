import { Link, useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();


// loader for chat list
export async function loader({ request }) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop"); // current store

  if (!shop) {
    return json({ sessions: [] });
  }

  // Get all sessions of this shop
  const sessions = await prisma.storeChatSession.findMany({
    where: { storeDomain: shop },
    orderBy: { lastSeenAt: "desc" },
  });

  return json({ sessions });
}



export default function ChatList() {
  const { sessions } = useLoaderData();

  return (
    <div>
      <h1>Chat Sessions for this Store</h1>
      <ul>
        {sessions.map((s) => (
          <li key={s.id}>
            <Link to={`/admin/chat/${s.sessionId}`}>
              👤 User: {s.sessionId} <br />
              🏬 Store: {s.storeDomain}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
