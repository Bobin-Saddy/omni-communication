import { Link, useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function loader() {
  const sessions = await prisma.storeChatSession.findMany({
    orderBy: { lastSeenAt: "desc" },
  });
  return json({ sessions });
}

export default function ChatList() {
  const { sessions } = useLoaderData();

  return (
    <div>
      <h1>Chat Sessions</h1>
      <ul>
        {sessions.map((s) => (
          <li key={s.id}>
            <Link to={`/admin/chat/${s.sessionId}`}>
              {s.storeDomain} - {s.sessionId}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
