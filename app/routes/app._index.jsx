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
  <div className="dashboard-container">
    {/* Sidebar - Conversations */}
    <div className="sidebar">
      <h3>💬 Conversations</h3>
      {!conversations.length ? (
        <p className="empty">No conversations</p>
      ) : (
        conversations.map((conv) => {
          const platform =
            conv.platform || // ← Add platform property when fetching
            (conv.pageName?.toLowerCase().includes("instagram")
              ? "instagram"
              : conv.pageName?.toLowerCase().includes("whatsapp")
              ? "whatsapp"
              : "facebook");

          return (
            <div
              key={conv.id}
              className={`conversation-item ${
                activeConversation?.id === conv.id ? "active" : ""
              } ${platform}`}
              onClick={() => setActiveConversation(conv)}
            >
              <span className="platform-icon">
                {platform === "facebook" && "📘"}
                {platform === "instagram" && "📸"}
                {platform === "whatsapp" && "📱"}
                {platform === "telegram" && "✈️"}
              </span>
              <div>
                <span className="page-tag">[{conv.pageName}]</span>
                <span className="conv-name">
                  {conv.participants?.data
                    ?.map((p) => p.name || p.username)
                    .join(", ") || "Unnamed"}
                </span>
              </div>
            </div>
          );
        })
      )}
    </div>

    {/* Chat Box */}
    <div className="chat-box">
      <div className="chat-header">
        {activeConversation ? (
          <>
            <h3>
              {activeConversation.participants?.data
                ?.map((p) => p.name || p.username)
                .join(", ") || "Unnamed"}
            </h3>
            <span className="chat-meta">
              from {activeConversation.pageName}
            </span>
          </>
        ) : (
          <h3>Select a conversation</h3>
        )}
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {activeConversation &&
        messages[activeConversation.id] &&
        messages[activeConversation.id].length ? (
          messages[activeConversation.id].map((msg, idx) => (
            <div
              key={idx}
              className={`message ${
                msg.from === "You" || msg.from?.name === "You"
                  ? "sent"
                  : "received"
              }`}
            >
              <div className="bubble">
                <p>{msg.text || msg.message}</p>
                <span className="timestamp">
                  {msg.timestamp
                    ? new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : msg.created_time}
                </span>
              </div>
            </div>
          ))
        ) : (
          <p className="empty">No messages yet.</p>
        )}
      </div>

      {/* Input */}
      {activeConversation && (
        <div className="chat-input">
          <input
            type="text"
            placeholder="Type a message..."
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.target.value.trim()) {
                setMessages((prev) => ({
                  ...prev,
                  [activeConversation.id]: [
                    ...(prev[activeConversation.id] || []),
                    {
                      from: "You",
                      message: e.target.value,
                      timestamp: new Date().toISOString(),
                    },
                  ],
                }));
                e.target.value = "";
              }
            }}
          />
          <button
            onClick={() => {
              const input = document.querySelector(".chat-input input");
              if (input.value.trim()) {
                setMessages((prev) => ({
                  ...prev,
                  [activeConversation.id]: [
                    ...(prev[activeConversation.id] || []),
                    {
                      from: "You",
                      message: input.value,
                      timestamp: new Date().toISOString(),
                    },
                  ],
                }));
                input.value = "";
              }
            }}
          >
            ➤
          </button>
        </div>
      )}
    </div>

    {/* ✅ Styling */}
    <style>{`
      .dashboard-container {
        display: flex;
        height: 90vh;
        border-radius: 12px;
        overflow: hidden;
        background: #f0f2f5;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        font-family: 'Segoe UI', sans-serif;
      }

      /* Sidebar */
      .sidebar {
        width: 28%;
        background: #fff;
        border-right: 1px solid #ddd;
        padding: 15px;
        overflow-y: auto;
      }
      .sidebar h3 {
        margin-bottom: 15px;
        font-size: 18px;
        color: #333;
      }
      .conversation-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px;
        border-radius: 10px;
        margin-bottom: 10px;
        cursor: pointer;
        transition: all 0.2s;
        background: #f9f9f9;
      }
      .conversation-item:hover {
        background: #ececec;
      }
      .conversation-item.active {
        background: linear-gradient(135deg, #25d366, #128c7e);
        color: white;
      }
      .conversation-item .platform-icon {
        font-size: 20px;
      }
      .page-tag {
        font-size: 11px;
        color: #666;
      }
      .conv-name {
        font-weight: 600;
        font-size: 14px;
      }

      /* Platform-specific */
      .conversation-item.facebook { border-left: 4px solid #1877f2; }
      .conversation-item.instagram { border-left: 4px solid #e4405f; }
      .conversation-item.whatsapp { border-left: 4px solid #25d366; }
      .conversation-item.telegram { border-left: 4px solid #0088cc; }

      /* Chat Box */
      .chat-box {
        flex: 1;
        display: flex;
        flex-direction: column;
        background: #ece5dd;
      }
      .chat-header {
        padding: 12px 15px;
        border-bottom: 1px solid #ddd;
        background: #fff;
      }
      .chat-header h3 {
        margin: 0;
        font-size: 16px;
      }
      .chat-meta {
        font-size: 12px;
        color: #666;
      }

      .chat-messages {
        flex: 1;
        padding: 15px;
        overflow-y: auto;
        background: #e5ddd5;
      }
      .message {
        margin-bottom: 12px;
        display: flex;
      }
      .message.sent {
        justify-content: flex-end;
      }
      .message .bubble {
        max-width: 65%;
        padding: 12px 16px;
        border-radius: 20px;
        font-size: 14px;
        line-height: 1.4;
        position: relative;
        box-shadow: 0 1px 3px rgba(0,0,0,0.2);
      }

      /* ✅ Sent (green gradient), Received (white) */
      .message.sent .bubble {
        background: linear-gradient(135deg, #25d366, #128c7e);
        color: white;
        border-bottom-right-radius: 5px;
      }
      .message.received .bubble {
        background: #fff;
        color: #222;
        border-bottom-left-radius: 5px;
      }

      .timestamp {
        display: block;
        font-size: 11px;
        margin-top: 6px;
        opacity: 0.7;
        text-align: right;
      }
      .message.sent .timestamp {
        color: #e0f7e9;
      }
      .message.received .timestamp {
        color: #777;
      }

      /* Input */
      .chat-input {
        display: flex;
        border-top: 1px solid #ddd;
        padding: 10px;
        background: #fff;
      }
      .chat-input input {
        flex: 1;
        padding: 10px 14px;
        border: 1px solid #ccc;
        border-radius: 20px;
        outline: none;
        font-size: 14px;
      }
      .chat-input input:focus {
        border-color: #25d366;
      }
      .chat-input button {
        margin-left: 8px;
        background: #25d366;
        border: none;
        color: white;
        padding: 0 16px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 18px;
        transition: background 0.2s;
      }
      .chat-input button:hover {
        background: #1ebe5c;
      }

      .empty {
        color: #888;
        text-align: center;
        margin-top: 20px;
      }
    `}</style>
  </div>
);
}
