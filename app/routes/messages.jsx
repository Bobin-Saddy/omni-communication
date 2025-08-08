import { useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import { getMessages } from "../lib/messagesStore";

export async function loader({ request }) {
  const url = new URL(request.url);
  const number = url.searchParams.get("number");

  if (!number) {
    return json({ number: null, messages: [] });
  }

  const messages = await getMessages(number);
  return json({ number, messages });
}

export default function Messages() {
  const { number, messages } = useLoaderData();

  if (!number) {
    return <p>No phone number provided.</p>;
  }

  return (
    <div style={{ padding: "1rem" }}>
      <h2>Messages for {number}</h2>
      {messages.length === 0 ? (
        <p>No messages found.</p>
      ) : (
        <ul>
          {messages.map((msg, index) => (
            <li key={index}>
              <strong>{msg.sender}:</strong> {msg.text}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
