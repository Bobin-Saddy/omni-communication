import { useState, useEffect, useRef } from "react";

export default function SocialChatDashboard({ connectedPages }) {
  // connectedPages = array of pages already connected (FB or IG)
  const [selectedPage, setSelectedPage] = useState(
    connectedPages?.length > 0 ? connectedPages[0] : null
  );
  const [conversations, setConversations] = useState([]);
  const messagesEndRef = useRef(null);

  // Auto-scroll messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversations]);

  // Fetch conversations whenever selectedPage changes
  useEffect(() => {
    if (!selectedPage) return;
    fetchConversations(selectedPage);
  }, [selectedPage]);

  const fetchConversations = async (page) => {
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
            const otherMsg = msgData.data.find((m) => m.from?.id !== page.igId);
            const userName =
              otherMsg?.from?.name || otherMsg?.from?.username || "Instagram User";

            return { ...conv, userName };
          })
        );
        setConversations(enriched);
      } else {
        setConversations(data.data);
      }
    } catch (err) {
      console.error("Error fetching conversations:", err);
      setConversations([]);
    }
  };

  return (
    <div style={{ maxWidth: 1400, margin: "auto", padding: 20 }}>
      <h1>Social Chat Dashboard</h1>

      <div style={{ marginTop: 40 }}>
        <h2>
          Conversations for {selectedPage?.name || "No page selected"}
        </h2>
        {conversations.length === 0 ? (
          <p>No conversations yet.</p>
        ) : (
          <ul>
            {conversations.map((conv) => (
              <li key={conv.id || conv.thread_key}>
                {conv.userName ||
                  conv.participants?.data?.map((p) => p.name).join(", ")}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div ref={messagesEndRef}></div>
    </div>
  );
}
