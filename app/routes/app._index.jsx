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

  // Scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeConversation]);

  // Fetch conversations whenever connected pages change
  useEffect(() => {
    if (!connectedPages.length) return;
    connectedPages.forEach((page) => fetchConversations(page));
  }, [connectedPages]);

  // Fetch conversations for a page (Facebook + Instagram via Page)
const fetchConversations = async (page) => {
  try {
    const token = page.access_token;

    const url = `https://graph.facebook.com/v18.0/${page.id}/conversations?fields=id,participants,messages{from,to,message,created_time},messaging_product&access_token=${token}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!Array.isArray(data.data)) return;

    const convs = data.data.map((c) => ({
      id: c.id,
      pageId: page.id,
      pageName: page.name,
      pageType: c.messaging_product === "instagram" ? "instagram" : "facebook",
      participants: c.participants,
      messages: c.messages?.data || [],
    }));

    setConversations((prev) => [
      ...prev.filter((c) => c.pageId !== page.id),
      ...convs,
    ]);
  } catch (err) {
    console.error("Error fetching conversations:", err);
  }
};

  // Fetch messages for a conversation (already included in fetchConversations)
  const fetchMessages = async (conversationId, page) => {
    const conv = conversations.find((c) => c.id === conversationId);
    if (!conv) return;

    setMessages((prev) => ({
      ...prev,
      [conversationId]: conv.messages.length
        ? conv.messages
        : [{ id: "local-1", from: { username: "system" }, message: "Start chatting..." }],
    }));
  };

  // Select a conversation
  const handleSelectConversation = (conv) => {
    setActiveConversation(conv);
    const page = connectedPages.find((p) => p.id === conv.pageId);
    if (!page) return;
    fetchMessages(conv.id, page);
  };

  // Send message
  const sendMessage = async (text) => {
    if (!activeConversation) return;
    const page = connectedPages.find((p) => p.id === activeConversation.pageId);
    if (!page) return;

    try {
      if (activeConversation.pageType === "instagram") {
        // Local placeholder for IG (cannot send via API in client)
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
        fetchMessages(activeConversation.id, page);
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
              {conv.pageType === "instagram"
                ? conv.participants?.data?.map((p) => p.name).join(", ") || "Instagram User"
                : conv.participants?.data?.map((p) => p.name).join(", ") || "Unnamed"}
            </div>
          ))
        )}
      </div>

      {/* RIGHT: Chat */}
      <div style={{ flex: 1, padding: 10, display: "flex", flexDirection: "column" }}>
        <h3>
          Chat:{" "}
          {activeConversation
            ? activeConversation.participants?.data?.map((p) => p.name).join(", ") ||
              activeConversation.from?.username
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
