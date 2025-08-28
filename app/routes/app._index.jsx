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

  const WHATSAPP_TOKEN =
    "EAAHvZAZB8ZCmugBPT9NT85FLIES5xzEtGZCWq5jZAZBrVvYfkiFbCq1OLdzZCzVzVtRxjdI5PKgUQZBO5JTTNJl5B3bzbX74mZAQg8ty9CL4orxBcdq08ISeZC2A3ZCZBWLxwhBxZBVdisAnNuZB9ZAEZAOcjFQO3YctzonA381s5OPMjOcQsSZCJrcAbOjqpfATEM1eCaZBgCleBquTGqbTFNZA0oAIm9ZCuZAwj4EJ0PUNju566I3nZCqQZDZD";
  const WHATSAPP_PHONE_NUMBER_ID = "106660072463312";

  /** ----------------- LOAD CONVERSATIONS ----------------- **/
  useEffect(() => {
    if (!connectedPages.length) return;
    connectedPages.forEach((page) => fetchConversations(page));
  }, [connectedPages]);

  useEffect(() => {
    if (activeConversation?.pageType === "chatwidget") {
      const es = new EventSource(
        `/api/chat/stream?sessionId=${activeConversation.id}&storeDomain=${activeConversation.storeDomain}`
      );

      es.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setMessages((prev) => ({
          ...prev,
          [activeConversation.id]: [
            ...(prev[activeConversation.id] || []),
            data,
          ],
        }));
      };

      return () => es.close();
    }
  }, [activeConversation]);

  /** ----------------- FETCH CONVERSATIONS ----------------- **/
  const fetchConversations = async (page) => {
    try {
      // ✅ WhatsApp
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
    // IG threads include the IG business (page.igId) and the user.
    const other = parts.find(p => p.id !== page.igId && p.id !== page.pageId) || {};
    const userName = other.name || other.username || "Instagram User";
    return {
     id: conv.id,
      pageId: page.id,          // same as page.pageId after fix in Settings
      pageName: page.name,
      pageType: "instagram",
      participants: { data: [{ id: other.id, name: userName }] }, // keep id!
      recipientId: other.id,    // store to send later
      updated_time: conv.updated_time,
    };
  });

   setConversations((prev) => [
     ...prev.filter((c) => c.pageId !== page.id),
     ...conversationsWithNames,
   ]);
   return;
}



      // ✅ Facebook
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

      // ✅ Chat Widget
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

          if (convs.length > 0) {
            const firstConv = convs[0];
            setActiveConversation(firstConv);

            const msgRes = await fetch(
              `/api/chat?storeDomain=${encodeURIComponent(
                firstConv.storeDomain || "myshop.com"
              )}&sessionId=${encodeURIComponent(firstConv.id)}`
            );
            if (msgRes.ok) {
              const msgData = await msgRes.json();
              setMessages((prev) => ({
                ...prev,
                [firstConv.id]: Array.isArray(msgData?.messages)
                  ? msgData.messages
                  : [],
              }));
            }
          }
        }
        return;
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

      if (page?.type === "chatwidget") {
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

    try {
      if (page.type === "chatwidget") {
        const res = await fetch(
          `/api/chat?storeDomain=${encodeURIComponent(
            conv.storeDomain || "myshop.com"
          )}&sessionId=${encodeURIComponent(conv.id)}`
        );

        if (res.ok) {
          const data = await res.json();
          setMessages((prev) => ({
            ...prev,
            [conv.id]: Array.isArray(data?.messages) ? data.messages : [],
          }));
        }
      } else if (page.type === "instagram" || page.type === "facebook") {
        const res = await fetch(
          `https://graph.facebook.com/v18.0/${conv.id}/messages?fields=from,to,message,created_time&access_token=${page.access_token}`
        );

        if (res.ok) {
          const data = await res.json();
          setMessages((prev) => ({
            ...prev,
            [conv.id]: Array.isArray(data?.data) ? data.data : [],
          }));
        }
      } else if (page.type === "whatsapp") {
        const res = await fetch(`/whatsapp-messages?number=${conv.id}`);
        const data = await res.json();
        setMessages((prev) => ({ ...prev, [conv.id]: data }));
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  /** ----------------- SEND MESSAGE ----------------- **/
  const sendMessage = async (text) => {
    if (!activeConversation) return;
    const page = connectedPages.find((p) => p.id === activeConversation.pageId);
    if (!page) return;

    try {
      // ✅ WhatsApp
      if (page.type === "whatsapp") {
        await fetch(
          `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages?access_token=${WHATSAPP_TOKEN}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              to: activeConversation.userNumber,
              text: { body: text },
            }),
          }
        );
        setMessages((prev) => ({
          ...prev,
          [activeConversation.id]: [
            ...(prev[activeConversation.id] || []),
            {
              from: "You",
              message: text,
              timestamp: new Date().toISOString(),
            },
          ],
        }));
        return;
      }

      // ✅ Instagram (API for send requires permissions – simulate for now)
 if (page.type === "instagram") {
   const recipientId =
     activeConversation.recipientId ||
     activeConversation.participants?.data?.find(p => p.id && p.id !== page.igId)?.id;
   if (!recipientId) {
     console.error("No IG recipient id on conversation");
     return;
   }

   const res = await fetch(
     `https://graph.facebook.com/v18.0/${page.pageId}/messages?access_token=${page.access_token}`,
     {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify({
         messaging_type: "RESPONSE",
         recipient: { id: recipientId },
        message: { text },
     }),
     }
   );
    const result = await res.json();
    if (res.ok && result.id) {
      setMessages((prev) => ({
        ...prev,
        [activeConversation.id]: [
          ...(prev[activeConversation.id] || []),
          { from: { name: "You" }, message: text, created_time: new Date().toISOString() },
        ],
      }));
    } else {
      console.error("Instagram send failed:", result);
    }
    return;
 }

      // ✅ Facebook
      if (page.type === "facebook") {
        const userParticipant = activeConversation.participants?.data?.find(
          (p) => p.id !== page.id
        );
        if (!userParticipant) return;

        const res = await fetch(
          `https://graph.facebook.com/v18.0/me/messages?access_token=${page.access_token}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              recipient: { id: userParticipant.id },
              message: { text },
              messaging_type: "MESSAGE_TAG",
              tag: "ACCOUNT_UPDATE",
            }),
          }
        );

        const result = await res.json();
        if (res.ok && result.message_id) {
          setMessages((prev) => ({
            ...prev,
            [activeConversation.id]: [
              ...(prev[activeConversation.id] || []),
              {
                from: { name: "You" },
                message: text,
                created_time: new Date().toISOString(),
              },
            ],
          }));
        }
        return;
      }

      // ✅ ChatWidget
      if (page.type === "chatwidget") {
        await fetch(`/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: activeConversation.id,
            storeDomain: activeConversation.storeDomain || "myshop.com",
            message: text,
          }),
        });
        setMessages((prev) => ({
          ...prev,
          [activeConversation.id]: [
            ...(prev[activeConversation.id] || []),
            {
              from: { name: "You" },
              message: text,
              created_time: new Date().toISOString(),
            },
          ],
        }));
      }
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  /** ----------------- UI ----------------- **/
  return (
    <div style={styles.container}>
      {/* Sidebar: Conversations */}
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
              onClick={() => setActiveConversation(conv)}
            >
              <div style={styles.convHeader}>
                <span style={styles.platformBadge(conv.pageType)}>
                  {conv.pageType.toUpperCase()}
                </span>
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
          {activeConversation ? (
            <>
              <span style={styles.platformBadge(activeConversation.pageType)}>
                {activeConversation.pageType.toUpperCase()}
              </span>
              <span style={styles.chatTitle}>
                {activeConversation.participants?.data
                  ?.map((p) => p.name || p.username)
                  .join(", ") || "Unnamed"}
              </span>
            </>
          ) : (
            "Select a conversation"
          )}
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
                  <div style={styles.messageText}>
                    {msg.text || msg.message}
                  </div>
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

        {/* Input */}
        {activeConversation && (
          <div style={styles.inputBox}>
            <input
              type="text"
              placeholder="Type a message..."
              style={styles.input}
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.target.value.trim()) {
                  sendMessage(e.target.value);
                  e.target.value = "";
                }
              }}
            />
            <button
              style={styles.sendBtn}
              onClick={() => {
                const input = document.querySelector("input");
                if (input.value.trim()) {
                  sendMessage(input.value);
                  input.value = "";
                }
              }}
            >
              ➤
            </button>
          </div>
        )}
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
    borderRadius: 8,
    overflow: "hidden",
    fontFamily: "Arial, sans-serif",
  },
  sidebar: {
    width: "28%",
    borderRight: "1px solid #ddd",
    padding: 10,
    background: "#fafafa",
    overflowY: "auto",
  },
  sidebarTitle: {
    margin: "5px 0 10px",
    fontSize: 18,
    fontWeight: "bold",
  },
  conversationItem: {
    padding: "10px 8px",
    borderRadius: 6,
    marginBottom: 6,
    cursor: "pointer",
    transition: "0.2s",
    border: "1px solid #eee",
  },
  convHeader: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  convName: { fontWeight: "bold", fontSize: 14 },
  platformBadge: (type) => ({
    fontSize: 10,
    fontWeight: "bold",
    padding: "2px 6px",
    borderRadius: 4,
    background:
      type === "whatsapp"
        ? "#25D366"
        : type === "instagram"
        ? "#E1306C"
        : type === "facebook"
        ? "#1877F2"
        : "#333",
    color: "#fff",
  }),
  chatArea: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    background: "#f9f9f9",
  },
  chatHeader: {
    padding: "12px 15px",
    borderBottom: "1px solid #ddd",
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontWeight: "bold",
    fontSize: 16,
    background: "#fff",
  },
  chatTitle: { fontSize: 15, fontWeight: "bold" },
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
    position: "relative",
    wordBreak: "break-word",
  },
  sent: {
    alignSelf: "flex-end",
    background: "#d1e7ff",
    color: "#000",
  },
  received: {
    alignSelf: "flex-start",
    background: "#fff",
    border: "1px solid #ddd",
  },
  messageText: { marginBottom: 4 },
  messageTime: { fontSize: 10, color: "#666", textAlign: "right" },
  inputBox: {
    display: "flex",
    borderTop: "1px solid #ddd",
    padding: 8,
    background: "#fff",
  },
  input: {
    flex: 1,
    padding: "10px 12px",
    borderRadius: 20,
    border: "1px solid #ccc",
    outline: "none",
  },
  sendBtn: {
    marginLeft: 8,
    padding: "10px 15px",
    border: "none",
    borderRadius: "50%",
    background: "#1877F2",
    color: "#fff",
    fontSize: 16,
    cursor: "pointer",
  },
};

