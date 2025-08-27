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

  // Scroll chat to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeConversation]);

  // Fetch conversations when connected pages update
  useEffect(() => {
    if (!connectedPages.length) return;
    connectedPages.forEach((page) => fetchConversations(page));
  }, [connectedPages]);

  // Fetch conversations for a page
  const fetchConversations = async (page) => {
    try {
      if (page.type === "instagram") {
        // Instagram: fetch messages instead of /conversations
        await fetchInstagramMessages(page);
        return;
      }

      // Facebook: fetch conversations normally
      const url = `https://graph.facebook.com/v18.0/${page.id}/conversations?fields=participants&access_token=${page.access_token}`;
      const res = await fetch(url);
      const data = await res.json();

      if (Array.isArray(data?.data)) {
        setConversations((prev) => [
          ...prev.filter((c) => c.pageId !== page.id),
          ...data.data.map((c) => ({
            ...c,
            pageId: page.id,
            pageName: page.name,
            pageType: "facebook",
          })),
        ]);
      }
    } catch (err) {
      console.error("❌ Error fetching conversations:", err);
    }
  };

  // Fetch Instagram messages correctly
  const fetchInstagramMessages = async (page) => {
    try {
      const token = page.access_token;

      const url = `https://graph.facebook.com/v18.0/${page.igId}/messages?access_token=${token}`;
      const res = await fetch(url);
      const data = await res.json();

      if (Array.isArray(data?.data) && data.data.length) {
        const igConversations = data.data.map((msg) => ({
          id: msg.from?.id || `ig-${Date.now()}`,
          pageId: page.id,
          pageName: page.name,
          pageType: "instagram",
          from: { username: msg.from?.username || "Instagram User" },
        }));

        setConversations((prev) => [
          ...prev.filter((c) => c.pageId !== page.id),
          ...igConversations,
        ]);
      } else {
        setConversations((prev) => [
          ...prev.filter((c) => c.pageId !== page.id),
          {
            id: `${page.id}-placeholder`,
            pageId: page.id,
            pageName: page.name,
            pageType: "instagram",
            from: { username: "Instagram Inbox" },
          },
        ]);
      }
    } catch (err) {
      console.error("❌ Error fetching Instagram messages:", err);
    }
  };

  // Fetch messages for a conversation
  const fetchMessages = async (conversationId, page) => {
    try {
      const token = page.access_token;

      if (page.type === "instagram") {
        if (conversationId.includes("placeholder")) {
          setMessages((prev) => ({
            ...prev,
            [conversationId]: [
              { id: "local-1", from: { username: "system" }, message: "Start chatting on Instagram 📸" },
            ],
          }));
          return;
        }

        const url = `https://graph.facebook.com/v18.0/${conversationId}/messages?fields=from,to,message,created_time&access_token=${token}`;
        const res = await fetch(url);
        const data = await res.json();

        if (Array.isArray(data?.data)) {
          setMessages((prev) => ({
            ...prev,
            [conversationId]: data.data,
          }));
        } else {
          setMessages((prev) => ({
            ...prev,
            [conversationId]: [
              { id: "local-1", from: { username: "system" }, message: "Start chatting on Instagram 📸" },
            ],
          }));
        }
        return;
      }

      // Facebook messages
      const url = `https://graph.facebook.com/v18.0/${conversationId}/messages?fields=from,to,message,created_time&access_token=${token}`;
      const res = await fetch(url);
      const data = await res.json();

      if (Array.isArray(data?.data)) {
        setMessages((prev) => ({ ...prev, [conversationId]: data.data }));
      }
    } catch (err) {
      console.error("❌ Error fetching messages:", err);
    }
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
      if (page.type === "instagram") {
        // Local placeholder for IG
        setMessages((prev) => ({
          ...prev,
          [activeConversation.id]: [
            ...(prev[activeConversation.id] || []),
            { id: Date.now(), from: { username: "me" }, message: text },
          ],
        }));
      } else {
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
                ? conv.from?.username || "Instagram User"
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
            ? activeConversation.pageType === "instagram"
              ? activeConversation.from?.username
              : activeConversation.participants?.data?.map((p) => p.name).join(", ")
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
