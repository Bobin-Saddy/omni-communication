// app/routes/messages.jsx

import { useSearchParams } from "@remix-run/react";
import { useLoaderData, redirect } from "@remix-run/node";
import { getMessages } from "./messagesStore";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const number = url.searchParams.get("number");

  if (!number) {
    return redirect("/app/whatsapp");
  }

  const messages = getMessages(number);
  return { number, messages };
};

export default function Messages() {
  const { number, messages } = useLoaderData();

  return (
    <div style={{ padding: "20px" }}>
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
