// app/routes/messages.jsx

import { useLoaderData } from "@remix-run/react"; // ✅ correct
import { json, redirect } from "@remix-run/node"; // ✅ server functions
import { getMessages } from "./messagesStore";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const number = url.searchParams.get("number");

  if (!number) {
    return redirect("/app/whatsapp");
  }

  const messages = getMessages(number);
  return json({ number, messages });
};

export default function Messages() {
  const { number, messages } = useLoaderData(); // ✅ this works now

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
