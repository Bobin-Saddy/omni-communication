import { Link, useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function loader({ request }) {
  // Get the current store from the Referer header (Shopify passes this when embedded in admin)
  const referer = request.headers.get("Referer") || "";
  let storeName = "";

  // Match /store/<storeName>/ inside the Shopify admin URL
  const match = referer.match(/\/store\/([^/]+)/);
  if (match) {
    storeName = match[1]; // e.g. "seo-partner"
  }

  let sessions = [];
  if (storeName) {
    sessions = await prisma.storeChatSession.findMany({
      where: { storeDomain: storeName },
      orderBy: { lastSeenAt: "desc" },
    });
  }

  return json({ sessions, storeName });
}

export default function ChatList() {
  const { sessions, storeName } = useLoaderData();

  return (
    <div>
      <h1>Chat Sessions for {storeName || "Unknown Store"}</h1>
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
