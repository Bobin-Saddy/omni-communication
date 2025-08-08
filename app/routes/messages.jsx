// app/routes/messages.jsx
import { useSearchParams } from "@remix-run/react";
import { useEffect, useState } from "react";
import { getMessages } from "./messagesStore"; // Adjust path if needed

export default function Messages() {
  const [searchParams] = useSearchParams();
  const number = searchParams.get("number");
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!number) return;

    const fetchMessages = async () => {
      try {
        const data = await getMessages(number);
        setMessages(data || []);
      } catch (err) {
        console.error("Failed to fetch messages", err);
      }
    };

    fetchMessages();
  }, [number]);

  if (!number) return <div>No number provided.</div>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>Messages for {number}</h2>
      {messages.length > 0 ? (
        <ul>
          {messages.map((msg, idx) => (
            <li key={idx}>
              <strong>{msg.sender}:</strong> {msg.text}
            </li>
          ))}
        </ul>
      ) : (
        <p>No messages found.</p>
      )}
    </div>
  );
}
