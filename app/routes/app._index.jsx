import { useEffect, useContext } from "react";
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

  // ✅ Whenever connectedPages change → fetch all conversations
  useEffect(() => {
    if (!connectedPages.length) return;

    connectedPages.forEach((page) => {
      fetchConversations(page);
    });
  }, [connectedPages]);

  // ✅ Fetch conversations for a specific page and merge into global state
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
        setConversations((prev) => [
          ...prev.filter((c) => c.pageId !== page.id), // remove old of same page
          ...data.data.map((c) => ({ ...c, pageId: page.id, pageName: page.name })),
        ]);
      }
    } catch (err) {
      console.error("Error fetching conversations:", err);
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

  // ✅ When a conversation is selected
  const handleSelectConversation = (conv) => {
    setActiveConversation(conv);

    const page = connectedPages.find((p) => p.id === conv.pageId);
    if (page) {
      fetchMessages(conv.id, page.access_token);
    }
  };

  // ✅ Send message API
  const sendMessage = async (text) => {
    if (!activeConversation) return;

    const page = connectedPages.find((p) => p.id === activeConversation.pageId);
    if (!page) return;

    try {
      const url = `https://graph.facebook.com/v18.0/${activeConversation.id}/messages`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          access_token: page.access_token,
        }),
      });
      const data = await res.json();
      console.log("Message sent:", data);

      // Refresh conversation after sending
      fetchMessages(activeConversation.id, page.access_token);
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  return (
    <div style={{ display: "flex", height: "90vh", border: "1px solid #ddd" }}>
      {/* LEFT: Conversations (from ALL connected pages) */}
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
                background:
                  activeConversation?.id === conv.id ? "#eee" : "transparent",
              }}
              onClick={() => handleSelectConversation(conv)}
            >
              <b>[{conv.pageName}]</b>{" "}
              {conv.participants?.data?.map((p) => p.name).join(", ") ||
                "Unnamed"}
            </div>
          ))
        )}
      </div>

      {/* RIGHT: Chatbox */}
      <div
        style={{
          flex: 1,
          padding: 10,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h3>
          Chat:{" "}
          {activeConversation
            ? activeConversation.participants?.data
                ?.map((p) => p.name)
                .join(", ")
            : "Select a conversation"}
        </h3>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            border: "1px solid #ccc",
            marginBottom: 10,
            padding: 10,
          }}
        >
          {activeConversation &&
          messages[activeConversation.id] &&
          messages[activeConversation.id].length ? (
            messages[activeConversation.id].map((msg) => (
              <div key={msg.id} style={{ marginBottom: 8 }}>
                <b>{msg.from?.name}:</b> {msg.message}{" "}
                <small>{msg.created_time}</small>
              </div>
            ))
          ) : (
            <p>No messages yet.</p>
          )}
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
