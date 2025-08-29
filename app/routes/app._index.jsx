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
    "EAAHvZAZB8ZCmugBPRgHGFSTweHGPR0O9m8iSRnzSZAkA8zAVZCUUgsP18KYtD5zQvhmxC7x4m9WBr3jehcU3SmVugIHCpfGisQe4ulaioGlBJb8PlzBtGnCKOPNvr2Br5pF6ZC4CJKOfFMLfZAg28YygayRGZCOjAdSyiGKqugZBqTMZCZBTOi1lJclcWUJCcmE1jCivOpHqHKKm1V6wtWmBwdZAP23HVhVMiIeHTdTBOk65DQZDZD";
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
 // ✅ WhatsApp
if (page.type === "whatsapp") {
  // 1. Send to WhatsApp API
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

  // 2. Save OUTGOING message to your DB
  await fetch("/save-whatsapp-messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      to: activeConversation.userNumber,
      from: WHATSAPP_PHONE_NUMBER_ID, // business number
      message: text,
      direction: "outgoing",
    }),
  });

  // 3. Update local state
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
  return  (
    <div className="chat-dashboard">
      <style>{`
        .chat-dashboard {
          display: flex;
          height: 90vh;
          border: 1px solid #ddd;
          border-radius: 12px;
          overflow: hidden;
          font-family: 'Segoe UI', Roboto, sans-serif;
        }

        /* Sidebar */
        .sidebar {
          width: 28%;
          border-right: 1px solid #ddd;
          background: #f7f9fc;
          display: flex;
          flex-direction: column;
        }
        .sidebar h3 {
          margin: 0;
          padding: 15px;
          font-size: 16px;
          font-weight: 600;
          border-bottom: 1px solid #ddd;
          background: #fff;
        }
        .conversation-item {
          padding: 12px 15px;
          cursor: pointer;
          transition: background 0.2s;
          border-bottom: 1px solid #eee;
        }
        .conversation-item:hover {
          background: #eef3f9;
        }
        .conversation-item.active {
          background: #dbeafe;
          font-weight: 600;
        }

        /* Chat Section */
        .chat-section {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: #fff;
        }
        .chat-header {
          padding: 15px;
          border-bottom: 1px solid #ddd;
          font-size: 16px;
          font-weight: 600;
          background: #f9fafb;
        }
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 15px;
          background: #f1f5f9;
        }
        .message {
          margin-bottom: 12px;
          max-width: 70%;
          padding: 10px 14px;
          border-radius: 12px;
          line-height: 1.4;
          position: relative;
          font-size: 14px;
        }
        .message small {
          display: block;
          font-size: 11px;
          margin-top: 4px;
          color: #666;
        }
        .message.user {
          background: #dbeafe;
          align-self: flex-end;
          text-align: right;
          border-bottom-right-radius: 4px;
        }
        .message.other {
          background: #fff;
          border: 1px solid #ddd;
          align-self: flex-start;
          border-bottom-left-radius: 4px;
        }

        /* Input Area */
        .chat-input {
          display: flex;
          border-top: 1px solid #ddd;
          padding: 10px;
          background: #fff;
        }
        .chat-input input {
          flex: 1;
          padding: 10px 12px;
          border: 1px solid #ccc;
          border-radius: 20px;
          outline: none;
          font-size: 14px;
        }
        .chat-input button {
          margin-left: 8px;
          padding: 0 18px;
          border: none;
          border-radius: 20px;
          background: #3b82f6;
          color: #fff;
          cursor: pointer;
          font-weight: 500;
          transition: background 0.2s;
        }
        .chat-input button:hover {
          background: #2563eb;
        }
      `}</style>

      {/* Sidebar */}
      <div className="sidebar">
        <h3>💬 Conversations</h3>
        {!conversations.length ? (
          <p style={{ padding: "15px", color: "#777" }}>No conversations</p>
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

      {/* Chat Section */}
      <div className="chat-section">
        <div className="chat-header">
          {activeConversation
            ? activeConversation.participants?.data
                ?.map((p) => p.name || p.username)
                .join(", ")
            : "Select a conversation"}
        </div>

        <div className="chat-messages">
          {activeConversation &&
          messages[activeConversation.id] &&
          messages[activeConversation.id].length ? (
            messages[activeConversation.id].map((msg, idx) => (
              <div
                key={idx}
                className={`message ${
                  msg.from === "You" || msg.from?.name === "You"
                    ? "user"
                    : "other"
                }`}
              >
                {msg.text || msg.message}
                <small>{msg.timestamp || msg.created_time}</small>
              </div>
            ))
          ) : (
            <p style={{ color: "#777" }}>No messages yet.</p>
          )}
        </div>

        {activeConversation && (
          <div className="chat-input">
            <input
              type="text"
              placeholder="Type a message..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  sendMessage(e.target.value);
                  e.target.value = "";
                }
              }}
            />
            <button
              onClick={() => {
                const input = document.querySelector(".chat-input input");
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
