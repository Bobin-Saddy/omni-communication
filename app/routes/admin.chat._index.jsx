import { Link, useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function loader({ request }) {
  // 🔹 Get the store identifier from the URL (e.g., seo-partner)
  const url = new URL(request.url);
  const pathnameParts = url.pathname.split("/");
  const storeDomain = pathnameParts[2]; // "seo-partner" from /store/seo-partner/apps/...

  // 🔹 Fetch only sessions for this store
  const sessions = await prisma.storeChatSession.findMany({
    where: { storeDomain },
    orderBy: { lastSeenAt: "desc" },
  });

  return json({ sessions, storeDomain });
}

export default function ChatList() {
  const { sessions, storeDomain } = useLoaderData();

  return (
    <div>
      <h1>Chat Sessions for {storeDomain}</h1>
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
