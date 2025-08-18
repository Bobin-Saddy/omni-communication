import { Link, useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();


export async function loader({ request }) {
  // Get shop from query or session
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop"); // from ?shop=example.myshopify.com

  if (!shop) {
    return json({ sessions: [] }); // no shop, return empty
  }

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
      <h1>Chat Sessions</h1>
      {sessions.length === 0 ? (
        <p>No chats found for this store.</p>
      ) : (
        <ul>
          {sessions.map((s) => (
            <li key={s.id}>
              <Link to={`/admin/chat/${s.sessionId}`}>
                {s.storeDomain} - {s.sessionId}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

