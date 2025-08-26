import { useState, useEffect, useRef } from "react";

export default function SocialChatDashboard({ selectedPage }) {
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Fetch conversations whenever selectedPage changes
  useEffect(() => {
    if (!selectedPage) return;
    fetchConversations(selectedPage);
  }, [selectedPage]);

  const fetchConversations = async (page) => {
    setLoadingConversations(true);
    setSelectedUser(null);
    setMessages([]);

    try {
      const token = page.access_token;
      const url =
        page.type === "instagram"
          ? `https://graph.facebook.com/v18.0/${page.id}/conversations?platform=instagram&fields=participants&access_token=${token}`
          : `https://graph.facebook.com/v18.0/${page.id}/conversations?fields=participants&access_token=${token}`;

      const res = await fetch(url);
      const data = await res.json();

      if (!Array.isArray(data?.data)) {
        setConversations([]);
        return;
      }

      if (page.type === "instagram") {
        const enriched = await Promise.all(
          data.data.map(async (conv) => {
            const msgRes = await fetch(
              `https://graph.facebook.com/v18.0/${conv.id}/messages?fields=from,message&limit=5&access_token=${token}`
            );
            const msgData = await msgRes.json();
            const otherMsg = msgData.data?.find((m) => m.from?.id !== page.igId);
            const userName =
              otherMsg?.from?.name || otherMsg?.from?.username || "Instagram User";

            return { ...conv, userName, threadId: conv.id };
          })
        );
        setConversations(enriched);
      } else {
        setConversations(
          data.data.map((conv) => ({
            ...conv,
            userName: conv.participants?.data
              ?.map((p) => p.name)
              .join(", "),
            threadId: conv.id,
          }))
        );
      }
    } catch (err) {
      console.error("Error fetching conversations:", err);
      setConversations([]);
    } finally {
      setLoadingConversations(false);
    }
  };

  const fetchMessages = async (conv) => {
    if (!selectedPage) return;
    setLoadingMessages(true);
    try {
      const token = selectedPage.access_token;
      const url = `https://graph.facebook.com/v18.0/${conv.threadId}/messages?fields=from,message,created_time&access_token=${token}`;
      const res = await fetch(url);
      const data = await res.json();
      setMessages(Array.isArray(data.data) ? data.data.reverse() : []);
    } catch (err) {
      console.error("Error fetching messages:", err);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleUserClick = (conv) => {
    setSelectedUser(conv.userName);
    fetchMessages(conv);
  };

  return (
    <div style={{ maxWidth: 1400, margin: "auto", padding: 20 }}>
      <h1>Social Chat Dashboard</h1>

      <div style={{ marginTop: 40 }}>
        <h2>Users</h2>
        {loadingConversations && <p>Loading users...</p>}
        {!loadingConversations && conversations.length === 0 && (
          <p>No users yet.</p>
        )}
        <ul>
          {conversations.map((conv) => (
            <li
              key={conv.threadId}
              style={{
                cursor: "pointer",
                fontWeight: selectedUser === conv.userName ? "bold" : "normal",
              }}
              onClick={() => handleUserClick(conv)}
            >
              {conv.userName}
            </li>
          ))}
        </ul>
      </div>

      {selectedUser && (
        <div style={{ marginTop: 30 }}>
          <h2>Chat with {selectedUser}</h2>
          {loadingMessages && <p>Loading messages...</p>}
          <ul>
            {messages.map((msg, idx) => (
              <li key={idx}>
                <strong>{msg.from?.name || msg.from?.username}: </strong>
                {msg.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div ref={messagesEndRef}></div>
    </div>
  );
}
