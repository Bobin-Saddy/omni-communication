import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import db from "../db.server"; // adjust path to your Prisma instance

// Loader function to fetch messages
export async function loader({ request }) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");
    const sessionId = url.searchParams.get("sessionId");
    const shop = url.searchParams.get("shop");

    let messages = [];
    let sessions = [];

    if (userId && userId !== "undefined") {
      messages = await prisma.chatMessage.findMany({
        where: { userId: parseInt(userId) },
        orderBy: { createdAt: "asc" },
      });
    } else if (sessionId && sessionId !== "undefined") {
      messages = await prisma.chatMessage.findMany({
        where: { sessionId: parseInt(sessionId) },
        orderBy: { createdAt: "asc" },
      });
    } else if (shop) {
      sessions = await prisma.storeChatSession.findMany({
        where: { storeDomain: shop },
        orderBy: { lastSeenAt: "desc" },
      });
    } else {
      sessions = await prisma.storeChatSession.findMany({
        orderBy: { lastSeenAt: "desc" },
      });
    }

    return json({ messages, sessions });
  } catch (err) {
    console.error("Loader error:", err);
    return json({ messages: [], sessions: [] });
  }
}

// React component
export default function ChatMessages() {
  const { messages = [], sessions = [] } = useLoaderData();

  if (messages.length > 0) {
    return (
      <div>
        <h2>Messages</h2>
        <ul>
          {messages.map((msg) => (
            <li key={msg.id}>
              <strong>{msg.sender}:</strong> {msg.content}
              <br />
              <small>{new Date(msg.createdAt).toLocaleString()}</small>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (sessions.length > 0) {
    return (
      <div>
        <h2>Sessions</h2>
        <ul>
          {sessions.map((s) => (
            <li key={s.id}>{s.storeDomain} (last seen {new Date(s.lastSeenAt).toLocaleString()})</li>
          ))}
        </ul>
      </div>
    );
  }

  return <p>No messages or sessions found.</p>;
}
