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
    <>
      {/* ✅ Inline CSS inside same file */}
      <style>{`
        .chat-dashboard {
          display: flex;
          height: 90vh;
          font-family: "Inter", sans-serif;
          border: 1px solid #ddd;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 6px 20px rgba(0,0,0,0.1);
        }
        .sidebar {
          width: 28%;
          background: #f8f9fa;
          border-right: 1px solid #ddd;
          padding: 12px;
          overflow-y: auto;
        }
        .sidebar-title {
          font-size: 1.2rem;
          font-weight: 600;
          margin-bottom: 12px;
        }
        .conversation-item {
          padding: 10px;
          border-radius: 8px;
          cursor: pointer;
          margin-bottom: 6px;
          transition: background 0.2s;
        }
        .conversation-item:hover {
          background: #e9ecef;
        }
        .conversation-item.active {
          background: #007bff;
          color: white;
        }
        .chat-box {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: #ffffff;
        }
        .chat-header {
          padding: 14px;
          background: #007bff;
          color: white;
          font-weight: 600;
          font-size: 1.1rem;
        }
        .messages {
          flex: 1;
          padding: 12px;
          overflow-y: auto;
          background: #f4f6f9;
          display: flex;
          flex-direction: column;
        }
        .message {
          max-width: 70%;
          margin-bottom: 12px;
          padding: 10px 14px;
          border-radius: 16px;
          font-size: 0.95rem;
          line-height: 1.4;
          position: relative;
          word-wrap: break-word;
        }
        .message.incoming {
          background: #ffffff;
          align-self: flex-start;
          border: 1px solid #ddd;
        }
        .message.outgoing {
          background: #007bff;
          color: white;
          align-self: flex-end;
        }
        .timestamp {
          font-size: 0.75rem;
          color: #888;
          margin-top: 4px;
          text-align: right;
        }
        .chat-input {
          display: flex;
          border-top: 1px solid #ddd;
          padding: 10px;
          background: #fff;
        }
        .chat-input input {
          flex: 1;
          padding: 10px;
          border-radius: 8px;
          border: 1px solid #ddd;
          outline: none;
          margin-right: 8px;
        }
        .chat-input input:focus {
          border-color: #007bff;
        }
        .chat-input button {
          background: #007bff;
          border: none;
          color: white;
          padding: 10px 16px;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .chat-input button:hover {
          background: #0056b3;
        }
        .empty {
          color: #777;
          font-style: italic;
        }
      `}</style>

      <div className="chat-dashboard">
        {/* Sidebar */}
        <div className="sidebar">
          <h3 className="sidebar-title">💬 Conversations</h3>
          {!conversations.length ? (
            <p className="empty">No conversations</p>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={`conversation-item ${
                  activeConversation?.id === conv.id ? "active" : ""
                }`}
                onClick={() => setActiveConversation(conv)}
              >
                <b>[{conv.pageName}]</b>{" "}
                {conv.participants?.data
                  ?.map((p) => p.name || p.username)
                  .join(", ") || "Unnamed"}
              </div>
            ))
          )}
        </div>

        {/* Chat Box */}
        <div className="chat-box">
          <div className="chat-header">
            {activeConversation
              ? activeConversation.participants?.data
                  ?.map((p) => p.name || p.username)
                  .join(", ") || "Unnamed"
              : "Select a conversation"}
          </div>

          <div className="messages">
            {activeConversation &&
            messages[activeConversation.id] &&
            messages[activeConversation.id].length ? (
              messages[activeConversation.id].map((msg, idx) => {
                const isOutgoing =
                  msg.from === "You" || msg.from?.name === "You";
                return (
                  <div
                    key={idx}
                    className={`message ${isOutgoing ? "outgoing" : "incoming"}`}
                  >
                    <div>{msg.text || msg.message}</div>
                    <div className="timestamp">
                      {msg.timestamp || msg.created_time}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="empty">No messages yet.</p>
            )}
          </div>

          {activeConversation && (
            <div className="chat-input">
              <input
                type="text"
                placeholder="Type a message..."
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.target.value.trim()) {
                    sendMessage(e.target.value);
                    e.target.value = "";
                  }
                }}
              />
              <button
                onClick={() => {
                  const input = document.querySelector(".chat-input input");
                  if (input.value.trim()) {
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
    </>
  );
}
