import { useState, useEffect, useRef, useContext } from "react";
import Settings from "./app.settings";
import { AppContext } from "./AppContext";

export default function SocialChatDashboard() {
  // const [selectedPage, setSelectedPage] = useState(null);
  // const [connectedPages, setConnectedPages] = useState([]);
  // const [conversations, setConversations] = useState([]);
    const { connectedPages, setConnectedPages, selectedPage, setSelectedPage } = useContext(AppContext);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversations]);

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
      setConversations(Array.isArray(data?.data) ? data.data : []);
    } catch (err) {
      console.error("Error fetching conversations:", err);
      setConversations([]);
    }
  };

  return (
    <div style={{ maxWidth: 1400, margin: "auto", padding: 20 }}>
      <h1>Social Chat Dashboard</h1>

      <Settings
        connectedPages={connectedPages}
        setConnectedPages={setConnectedPages}
        selectedPage={selectedPage}
        setSelectedPage={setSelectedPage}
      />

      <div style={{ marginTop: 40 }}>
        <h2>Conversations</h2>
        {conversations.length === 0 ? <p>No conversations yet.</p> : (
          <ul>
            {conversations.map((conv) => (
              <li key={conv.id || conv.thread_key}>
                {conv.userName || conv.participants?.data?.map((p) => p.name).join(", ")}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div ref={messagesEndRef}></div>
    </div>
  );
}
