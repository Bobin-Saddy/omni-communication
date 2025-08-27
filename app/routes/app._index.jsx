

import { useEffect, useRef, useContext, useState } from "react";
import { AppContext } from "./AppContext";

export default function SocialChatDashboard() {
  const { selectedPage, conversations, setConversations } =
    useContext(AppContext);

  const [messages, setMessages] = useState({});
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!selectedPage) return;
    fetchConversations(selectedPage);
  }, [selectedPage]);

  // Auto scroll when new messages come
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const fetchConversations = async (page) => {
    try {
      const token = page.access_token;
      const url =
        page.type === "instagram"
          ? `https://graph.facebook.com/v18.0/${page.id}/conversations?platform=instagram&fields=participants&access_token=${token}`
          : `https://graph.facebook.com/v18.0/${page.id}/conversations?fields=participants&access_token=${token}`;

      const res = await fetch(url);
      const data = await res.json();

      if (Array.isArray(data?.data)) {
        setConversations(data.data);

        // ✅ Fetch messages for each conversation
        data.data.forEach((conv) => fetchMessages(conv.id, token));
      } else {
        setConversations([]);
      }
    } catch (err) {
      console.error("Error fetching conversations:", err);
      setConversations([]);
    }
  };

  const fetchMessages = async (conversationId, token) => {
    try {
      const url = `https://graph.facebook.com/v18.0/${conversationId}/messages?fields=from,to,message,created_time&access_token=${token}`;
      const res = await fetch(url);
      const data = await res.json();

      if (Array.isArray(data?.data)) {
        setMessages((prev) => ({
          ...prev,
          [conversationId]: data.data,
        }));
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  return (
    <div style={{ maxWidth: 1400, margin: "auto", padding: 20 }}>
      <h1>Social Chat Dashboard</h1>

      <div style={{ marginTop: 40 }}>
        <h2>Conversations</h2>
        {!conversations || conversations.length === 0 ? (
          <p>No conversations yet.</p>
        ) : (
          <ul>
            {conversations.map((conv) => (
              <li key={conv.id}>
                <strong>
                  {conv.participants?.data
                    ?.map((p) => p.name)
                    .join(", ") || "Unnamed"}
                </strong>
                <ul style={{ marginLeft: 20 }}>
                  {messages[conv.id]?.map((msg) => (
                    <li key={msg.id}>
                      <b>{msg.from?.name}:</b> {msg.message}{" "}
                      <small>({msg.created_time})</small>
                    </li>
                  )) || <li>Loading messages...</li>}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div ref={messagesEndRef}></div>
    </div>
  );
}
