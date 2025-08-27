import { useEffect, useContext, useRef } from "react";
import { AppContext } from "./AppContext";

export default function SocialChatDashboard() {
  const {
    connectedPages,
    conversations,
    setConversations,
    activeConversation,
    setActiveConversation,
    messages,
    setMessages,
  } = useContext(AppContext);

  const messagesEndRef = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeConversation]);

  // Fetch conversations when connected pages change
  useEffect(() => {
    if (!connectedPages.length) return;
    connectedPages.forEach((page) => {
      if (page.type === "instagram") fetchIGConversations(page);
      else fetchFBConversations(page);
    });
  }, [connectedPages]);

  // --- Instagram Conversations ---
  const fetchIGConversations = async (page) => {
    try {
      const url = `https://graph.facebook.com/v18.0/${page.id}/conversations?fields=participants,thread_type&access_token=${page.access_token}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!data?.data) return;

      const igConvs = data.data.filter(
        (conv) => conv.thread_type === "ONE_TO_ONE" || conv.thread_type === "IG"
      );

      setConversations((prev) => [
        ...prev.filter((c) => c.pageId !== page.id),
        ...igConvs.map((c) => ({
          ...c,
          pageId: page.id,
          pageName: page.name,
          pageType: "instagram",
          participants: c.participants?.data || [],
        })),
      ]);
    } catch (err) {
      console.error("Error fetching IG conversations:", err);
    }
  };

  // --- Facebook Conversations ---
  const fetchFBConversations = async (page) => {
    try {
      const url = `https://graph.facebook.com/v18.0/${page.id}/conversations?fields=participants&access_token=${page.access_token}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!Array.isArray(data?.data)) return;

      const fbConvs = data.data.map((c) => ({
        ...c,
        pageId: page.id,
        pageName: page.name,
        pageType: "facebook",
      }));

      setConversations((prev) => [
        ...prev.filter((c) => c.pageId !== page.id),
        ...fbConvs,
      ]);
    } catch (err) {
      console.error("❌ Error fetching FB conversations:", err);
    }
  };

  // --- Instagram Messages ---
  const fetchIGMessages = async (convId, page) => {
    if (convId.includes("placeholder")) {
      setMessages((prev) => ({
        ...prev,
        [convId]: [
          {
            id: "local-1",
            from: { username: "system" },
            message: "Start chatting on Instagram 📸",
          },
        ],
      }));
      return;
    }
    const url = `https://graph.facebook.com/v18.0/${convId}/messages?fields=from,to,message,created_time&access_token=${page.access_token}`;
    const res = await fetch(url);
    const data = await res.json();
    setMessages((prev) => ({
      ...prev,
      [convId]: Array.isArray(data.data) ? data.data : [],
    }));
  };

  // --- Facebook Messages ---
  const fetchFBMessages = async (convId, page) => {
    try {
      const url = `https://graph.facebook.com/v18.0/${convId}/messages?fields=from,to,message,created_time&access_token=${page.access_token}`;
      const res = await fetch(url);
      const data = await res.json();
      setMessages((prev) => ({
        ...prev,
        [convId]: Array.isArray(data.data) ? data.data : [],
      }));
    } catch (err) {
      console.error("❌ Error fetching FB messages:", err);
    }
  };

  // --- Select conversation ---
  const handleSelectConversation = (conv) => {
    setActiveConversation(conv);
    const page = connectedPages.find((p) => p.id === conv.pageId);
    if (!page) return;

    if (page.type === "instagram") fetchIGMessages(conv.id, page);
    else fetchFBMessages(conv.id, page);
  };

  // --- Send message ---
  const sendMessage = async (text) => {
    if (!activeConversation || !text) return;
    const page = connectedPages.find((p) => p.id === activeConversation.pageId);
    if (!page) return;

    try {
      if (page.type === "instagram") {
        // Local placeholder
        setMessages((prev) => ({
          ...prev,
          [activeConversation.id]: [
            ...(prev[activeConversation.id] || []),
            { id: Date.now(), from: { username: "me" }, message: text },
          ],
        }));
      } else {
        // Facebook DM
        const url = `https://graph.facebook.com/v18.0/me/messages?access_token=${page.access_token}`;
        const body = { recipient: { id: activeConversation.id }, message: { text } };
        await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        fetchFBMessages(activeConversation.id, page);
      }
    } catch (err) {
      console.error("❌ Error sending message:", err);
    }
  };

  return (
    <div style={{ display: "flex", height: "90vh", border: "1px solid #ddd" }}>
      {/* LEFT: Conversations */}
      <div style={{ width: "30%", borderRight: "1px solid #ddd", padding: 10 }}>
        <h3>Conversations</h3>
        {!conversations.length ? (
          <p>No conversations</p>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.id}
              style={{
                padding: 8,
                cursor: "pointer",
                background: activeConversation?.id === conv.id ? "#eee" : "transparent",
              }}
              onClick={() => handleSelectConversation(conv)}
            >
              <b>[{conv.pageName}]</b>{" "}
              {conv.participants?.map((p) => p.name || p.username).join(", ") ||
                conv.from?.username ||
                "Unnamed"}
            </div>
          ))
        )}
      </div>

      {/* RIGHT: Chat */}
      <div style={{ flex: 1, padding: 10, display: "flex", flexDirection: "column" }}>
        <h3>
          Chat:{" "}
          {activeConversation
            ? activeConversation.participants?.map((p) => p.name || p.username).join(", ") || activeConversation.from?.username
            : "Select a conversation"}
        </h3>

        <div style={{ flex: 1, overflowY: "auto", border: "1px solid #ccc", marginBottom: 10, padding: 10 }}>
          {activeConversation &&
          messages[activeConversation.id] &&
          messages[activeConversation.id].length ? (
            messages[activeConversation.id].map((msg) => (
              <div key={msg.id} style={{ marginBottom: 8 }}>
                <b>{msg.from?.name || msg.from?.username}:</b> {msg.message}{" "}
                <small>{msg.created_time || ""}</small>
              </div>
            ))
          ) : (
            <p>No messages yet.</p>
          )}
          <div ref={messagesEndRef}></div>
        </div>

        {activeConversation && (
          <div style={{ display: "flex" }}>
            <input
              type="text"
              placeholder="Type a message..."
              style={{ flex: 1, padding: 8 }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  sendMessage(e.target.value);
                  e.target.value = "";
                }
              }}
            />
            <button
              onClick={() => {
                const input = document.querySelector("input");
                if (input.value) {
                  sendMessage(input.value);
                  input.value = "";
                }
              }}
            >
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
