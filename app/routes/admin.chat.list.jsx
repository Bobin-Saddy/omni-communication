import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import db from "../db.server"; // adjust path to your Prisma instance

// Loader function to fetch messages
export async function loader({ request }) {
  const url = new URL(request.url);
  const conversationId = url.searchParams.get("conversationId");

  if (!conversationId) {
    return json({ error: "conversationId is required" }, { status: 400 });
  }

  // Fetch messages with conversation relation
  const messages = await db.chatMessage.findMany({
    where: { conversationId: Number(conversationId) },
    orderBy: { createdAt: "asc" }, // oldest to newest
    include: {
      conversation: true,
    },
  });

  return json({ messages });
}

// React component
export default function ChatMessages() {
  const { messages } = useLoaderData();

  return (
    <div style={{ padding: "20px" }}>
      <h2>Chat Messages</h2>
      {messages.length === 0 ? (
        <p>No messages found.</p>
      ) : (
        <ul>
          {messages.map((msg) => (
            <li key={msg.id}>
              <strong>{msg.sender}:</strong> {msg.content}
              <br />
              <small>{new Date(msg.createdAt).toLocaleString()}</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
