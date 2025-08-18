import { Link, useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function loader({ request }) {
  const url = new URL(request.url);
  const host = url.searchParams.get("shop"); // e.g. seo-partner.myshopify.com

  let storeName = null;
  if (host) {
    storeName = host.split(".")[0]; // "seo-partner"
  }

  const sessions = await prisma.storeChatSession.findMany({
    where: storeName ? { storeDomain: storeName } : {},
    orderBy: { lastSeenAt: "desc" },
  });

  return json({ sessions, storeName });
}

export default function ChatList() {
  const { sessions, storeName } = useLoaderData();

  return (
    <div>
      <h1>Chat Sessions for {storeName}</h1>
      {sessions.length === 0 ? (
        <p>No chat sessions found for this store.</p>
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
