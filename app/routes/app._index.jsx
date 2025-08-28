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

  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeConversation]);

  
  /** ----------------- FETCH CONVERSATIONS ----------------- **/
  useEffect(() => {
    if (!connectedPages.length) return;
    connectedPages.forEach((page) => fetchConversations(page));
  }, [connectedPages]);

  const fetchConversations = async (page) => {
    try {
      if (page.type === "whatsapp") {
        const res = await fetch("/whatsapp-users");
        const users = await res.json();
        const convs = users.map((u) => ({
          id: u.number,
          pageId: page.id,
          pageName: page.name,
          pageType: "whatsapp",
          participants: { data: [{ name: u.name || u.number }] },
          userNumber: u.number,
        }));
        setConversations((prev) => [
          ...prev.filter((c) => c.pageId !== page.id),
          ...convs,
        ]);
        return;
      }

      if (page.type === "instagram") {
        const res = await fetch(
          `https://graph.facebook.com/v18.0/${page.pageId}/conversations?platform=instagram&fields=id,participants,updated_time&access_token=${page.access_token}`
        );
        const data = await res.json();
        if (!Array.isArray(data?.data)) return;

        const conversationsWithNames = data.data.map((conv) => {
          const parts = conv.participants?.data || [];
          const other =
            parts.find((p) => p.id !== page.igId && p.id !== page.pageId) || {};
          const userName = other.name || other.username || "Instagram User";
          return {
            id: conv.id,
            pageId: page.id,
            pageName: page.name,
            pageType: "instagram",
            participants: { data: [{ id: other.id, name: userName }] },
            recipientId: other.id,
            updated_time: conv.updated_time,
          };
        });

        setConversations((prev) => [
          ...prev.filter((c) => c.pageId !== page.id),
          ...conversationsWithNames,
        ]);
        return;
      }

      if (page.type === "facebook") {
        const url = `https://graph.facebook.com/v18.0/${page.id}/conversations?fields=participants&access_token=${page.access_token}`;
        const res = await fetch(url);
        const data = await res.json();
        if (Array.isArray(data?.data)) {
          const convs = data.data.map((c) => ({
            id: c.id,
            pageId: page.id,
            pageName: page.name,
            pageType: "facebook",
            participants: {
              data:
                c.participants?.data?.map((p) => ({
                  name: p.name || p.username || p.id,
                  id: p.id,
                })) || [],
            },
          }));
          setConversations((prev) => [
            ...prev.filter((c) => c.pageId !== page.id),
            ...convs,
          ]);
        }
        return;
      }

      if (page.type === "chatwidget") {
        const res = await fetch(`/api/chat?widget=true`);
        const data = await res.json();
        if (Array.isArray(data?.sessions)) {
          const convs = data.sessions.map((s) => ({
            id: s.sessionId,
            pageId: page.id,
            pageName: page.name,
            pageType: "chatwidget",
            participants: { data: [{ name: s.userName || s.sessionId }] },
            sessionId: s.sessionId,
            storeDomain: s.storeDomain,
          }));
          setConversations((prev) => [
            ...prev.filter((c) => c.pageId !== page.id),
            ...convs,
          ]);
        }
      }
    } catch (err) {
      console.error("Error fetching conversations:", err);
    }
  };

  /** ----------------- FETCH MESSAGES ----------------- **/
  const fetchMessages = async (conversationId, page) => {
    try {
      if (page.type === "whatsapp") {
        const res = await fetch(`/whatsapp-messages?number=${conversationId}`);
        const data = await res.json();
        setMessages((prev) => ({ ...prev, [conversationId]: data }));
        return;
      }

      if (page.type === "instagram" || page.type === "facebook") {
        const url = `https://graph.facebook.com/v18.0/${conversationId}/messages?fields=from,to,message,created_time&access_token=${page.access_token}`;
        const res = await fetch(url);
        const data = await res.json();
        setMessages((prev) => ({
          ...prev,
          [conversationId]: Array.isArray(data?.data) ? data.data : [],
        }));
        return;
      }

      if (page.type === "chatwidget") {
        const res = await fetch(
          `/api/chat?storeDomain=${encodeURIComponent(
            page.shopDomain || "myshop.com"
          )}&sessionId=${encodeURIComponent(conversationId)}`
        );
        if (res.ok) {
          const data = await res.json();
          setMessages((prev) => ({
            ...prev,
            [conversationId]: Array.isArray(data?.messages)
              ? data.messages
              : [],
          }));
        }
        return;
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  /** ----------------- SELECT CONVERSATION ----------------- **/
  const handleSelectConversation = async (conv) => {
    setActiveConversation(conv);
    const page = connectedPages.find((p) => p.id === conv.pageId);
    if (!page) return;
    await fetchMessages(conv.id, page);
  };

  /** ----------------- UI ----------------- **/
  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <h3 style={styles.sidebarTitle}>Conversations</h3>
        {!conversations.length ? (
          <p>No conversations</p>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.id}
              style={{
                ...styles.conversationItem,
                background:
                  activeConversation?.id === conv.id ? "#e3f2fd" : "#fff",
              }}
              onClick={() => handleSelectConversation(conv)}
            >
              <div>
                <span style={styles.convName}>
                  {conv.participants?.data
                    ?.map((p) => p.name || p.username)
                    .join(", ") || "Unnamed"}
                </span>
              </div>
              <small style={{ color: "#666" }}>{conv.pageName}</small>
            </div>
          ))
        )}
      </div>

      {/* Chat Area */}
      <div style={styles.chatArea}>
        <div style={styles.chatHeader}>
          {activeConversation
            ? activeConversation.participants?.data
                ?.map((p) => p.name || p.username)
                .join(", ")
            : "Select a conversation"}
        </div>

        {/* Messages */}
        <div style={styles.messagesBox}>
          {activeConversation &&
          messages[activeConversation.id] &&
          messages[activeConversation.id].length ? (
            messages[activeConversation.id].map((msg, idx) => {
              const isSent =
                (typeof msg.from === "string" && msg.from === "You") ||
                msg.from?.name === "You";
              return (
                <div
                  key={idx}
                  style={{
                    ...styles.messageBubble,
                    ...(isSent ? styles.sent : styles.received),
                  }}
                >
                  <div>{msg.text || msg.message}</div>
                  <div style={styles.messageTime}>
                    {msg.timestamp ||
                      msg.created_time ||
                      new Date().toLocaleTimeString()}
                  </div>
                </div>
              );
            })
          ) : (
            <p style={{ color: "#888" }}>No messages yet.</p>
          )}
          <div ref={chatEndRef} />
        </div>
      </div>
    </div>
  );
}

/** ----------------- Styles ----------------- **/
const styles = {
  container: {
    display: "flex",
    height: "90vh",
    border: "1px solid #ddd",
    fontFamily: "Arial, sans-serif",
  },
  sidebar: {
    width: "28%",
    borderRight: "1px solid #ddd",
    padding: 10,
    background: "#fafafa",
    overflowY: "auto",
  },
  sidebarTitle: { fontSize: 18, marginBottom: 10 },
  conversationItem: {
    padding: "10px 8px",
    borderRadius: 6,
    marginBottom: 6,
    cursor: "pointer",
    border: "1px solid #eee",
  },
  convName: { fontWeight: "bold", fontSize: 14 },
  chatArea: { flex: 1, display: "flex", flexDirection: "column" },
  chatHeader: {
    padding: 12,
    borderBottom: "1px solid #ddd",
    fontWeight: "bold",
  },
  messagesBox: {
    flex: 1,
    padding: 15,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  messageBubble: {
    maxWidth: "60%",
    padding: "8px 12px",
    borderRadius: 16,
    fontSize: 14,
    wordBreak: "break-word",
  },
  sent: {
    alignSelf: "flex-end",
    background: "#d1e7ff",
  },
  received: {
    alignSelf: "flex-start",
    background: "#fff",
    border: "1px solid #ddd",
  },
  messageTime: { fontSize: 10, color: "#666", textAlign: "right" },
};
