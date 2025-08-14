import { useLoaderData, Form } from "@remix-run/react";
import { json, redirect } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function loader({ params }) {
  const { sessionId } = params;

  const messages = await prisma.storeChatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
  });

  return json({ messages, sessionId });
}

export async function action({ request, params }) {
  const formData = await request.formData();
  const text = formData.get("text");
  const sessionId = params.sessionId;

  const session = await prisma.storeChatSession.findUnique({
    where: { sessionId },
  });

  if (!session) {
    throw new Response("Session not found", { status: 404 });
  }

  await prisma.storeChatMessage.create({
    data: {
      storeDomain: session.storeDomain,
      sessionId,
      sender: "owner",
      text,
    },
  });

  return redirect(`/admin/chat/${sessionId}`);
}

export default function ChatDetail() {
  const { messages, sessionId } = useLoaderData();

  return (
    <div>
      <h2>Session: {sessionId}</h2>
      <div
        style={{
          border: "1px solid #ccc",
          padding: "10px",
          height: "300px",
          overflow: "auto",
        }}
      >
        {messages.map((m) => (
          <div
            key={m.id}
            style={{ textAlign: m.sender === "owner" ? "right" : "left" }}
          >
            <b>{m.sender}</b>: {m.text}
          </div>
        ))}
      </div>

      <Form method="post">
        <input type="text" name="text" placeholder="Type your reply..." />
        <button type="submit">Send</button>
      </Form>
    </div>
  );
}
