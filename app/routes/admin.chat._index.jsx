import { Link, useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function extractStoreName(request) {
  const referer = request.headers.get("Referer") || "";

  // case: admin.shopify.com/store/seo-partner/...
  const match = referer.match(/\/store\/([^/]+)/);
  if (match) {
    return match[1]; // "seo-partner"
  }

  // case: seo-partner.myshopify.com
  try {
    const url = new URL(referer);
    return url.hostname.split(".")[0]; // "seo-partner"
  } catch {
    return null;
  }
}

export async function loader({ request }) {
  const storeDomain = extractStoreName(request);

  let sessions = [];
  if (storeDomain) {
    sessions = await prisma.storeChatSession.findMany({
      where: { storeDomain },
      orderBy: { lastSeenAt: "desc" },
    });
  }

  return json({ sessions, storeDomain });
}

export default function ChatList() {
  const { sessions, storeDomain } = useLoaderData();

  return (
    <div>
      <h1>Chat Sessions for {storeDomain || "Unknown Store"}</h1>
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
