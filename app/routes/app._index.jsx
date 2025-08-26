import { useState, useEffect, useRef } from "react";
import Settings from "./app.settings";

export default function SocialChatDashboard() {
  const [selectedPage, setSelectedPage] = useState(null);
  const [fbPages, setFbPages] = useState([]);
  const [igPages, setIgPages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(false);

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
    setLoadingConversations(true);
    try {
      const token = page.access_token;
      const url =
        page.type === "instagram"
          ? `https://graph.facebook.com/v18.0/${page.id}/conversations?platform=instagram&fields=participants&access_token=${token}`
          : `https://graph.facebook.com/v18.0/${page.id}/conversations?fields=participants&access_token=${token}`;

      const res = await fetch(url);
      const data = await res.json();

      if (!data?.data) {
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

            return { ...conv, userName, businessName: page.name };
          })
        );
        setConversations(enriched);
      } else {
        setConversations(data.data);
      }
    } catch (err) {
      console.error("Error fetching conversations:", err);
      setConversations([]);
    } finally {
      setLoadingConversations(false);
    }
  };

  return (
    <div style={{ maxWidth: 1400, margin: "auto", padding: 20 }}>
      <h1>Social Chat Dashboard</h1>

      <Settings
        selectedPage={selectedPage}
        setSelectedPage={setSelectedPage}
        fbPages={fbPages}
        setFbPages={setFbPages}
        igPages={igPages}
        setIgPages={setIgPages}
      />

      <div style={{ marginTop: 40 }}>
        <h2>Conversations</h2>
        {loadingConversations && <p>Loading conversations...</p>}
        {!loadingConversations && conversations.length === 0 && (
          <p>No conversations yet.</p>
        )}
        <ul>
          {conversations.map((conv) => (
            <li key={conv.id || conv.thread_key}>
              {conv.userName || conv.participants?.data?.map((p) => p.name).join(", ")}
            </li>
          ))}
        </ul>
      </div>

      <div ref={messagesEndRef}></div>
    </div>
  );
}
