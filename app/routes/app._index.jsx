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
          data, // new incoming message
        ],
      }));
    };

    return () => es.close();
  }
}, [activeConversation]);


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
        setConversations((prev) => [...prev.filter((c) => c.pageId !== page.id), ...convs]);
        return;
      }

      if (page.type === "instagram" || page.type === "facebook") {
        const url = `https://graph.facebook.com/v18.0/${page.id}/conversations?fields=participants&access_token=${page.access_token}`;
        const res = await fetch(url);
        const data = await res.json();
        if (Array.isArray(data?.data)) {
          const convs = data.data.map((c) => ({
            id: c.id,
            pageId: page.id,
            pageName: page.name,
            pageType: page.type,
            participants: {
              data: c.participants?.data?.map((p) => ({
                name: p.name || p.username || p.id,
                id: p.id,
              })) || [],
            },
          }));
          setConversations((prev) => [...prev.filter((c) => c.pageId !== page.id), ...convs]);
        }
        return;
      }

if (page.type === "chatwidget") {
  const res = await fetch(`/api/chat?widget=true`);
  const data = await res.json();

  if (Array.isArray(data?.sessions)) {
    const convs = data.sessions.map((s) => ({
      id: s.sessionId, // ✅ we use sessionId as id everywhere
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

    // ✅ auto-select first chatwidget conversation & load its messages
    if (convs.length > 0) {
      const firstConv = convs[0];
      setActiveConversation(firstConv);

      const msgRes = await fetch(
        `/api/chat?storeDomain=${encodeURIComponent(firstConv.storeDomain || "myshop.com")}&sessionId=${encodeURIComponent(firstConv.id)}`
      );
      if (msgRes.ok) {
        const msgData = await msgRes.json();
        setMessages((prev) => ({
          ...prev,
          [firstConv.id]: Array.isArray(msgData?.messages) ? msgData.messages : [],
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
  try {
    if (!conversationId) return;

    const res = await fetch(
      `/api/chat?storeDomain=${encodeURIComponent(
        page.shopDomain || "myshop.com"
      )}&sessionId=${encodeURIComponent(conversationId)}`
    );

    if (!res.ok) {
      console.error("Failed to fetch chat messages:", res.statusText);
      return;
    }

    const data = await res.json();

    setMessages((prev) => ({
      ...prev,
      [conversationId]: Array.isArray(data?.messages) ? data.messages : [],
    }));
  } catch (err) {
    console.error("Error fetching chat messages:", err);
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
  if (!page) {
    console.error("Page not found for conversation:", conv);
    return;
  }

  try {
    if (page.type === "chatwidget") {
      const res = await fetch(
        `/api/chat?storeDomain=${encodeURIComponent(conv.storeDomain || "myshop.com")}&sessionId=${encodeURIComponent(conv.id)}`
      );

      if (!res.ok) {
        console.error("Failed to fetch chat messages", await res.text());
        return;
      }

      const data = await res.json();
      setMessages((prev) => ({
        ...prev,
        [conv.id]: Array.isArray(data?.messages) ? data.messages : [],
      }));
    } else if (page.type === "instagram" || page.type === "facebook") {
      const res = await fetch(
        `https://graph.facebook.com/v18.0/${conv.id}/messages?fields=from,to,message,created_time&access_token=${page.access_token}`
      );

      if (!res.ok) {
        console.error("Failed to fetch FB/IG messages", await res.text());
        return;
      }

      const data = await res.json();
      setMessages((prev) => ({
        ...prev,
        [conv.id]: Array.isArray(data?.data) ? data.data : [],
      }));
    } else if (page.type === "whatsapp") {
      const res = await fetch(`/whatsapp-messages?number=${conv.id}`);
      const data = await res.json();
      setMessages((prev) => ({
        ...prev,
        [conv.id]: data,
      }));
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
      if (page.type === "whatsapp") {
        const res = await fetch(
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
        if (res.ok) {
          setMessages((prev) => ({
            ...prev,
            [activeConversation.id]: [
              ...(prev[activeConversation.id] || []),
              { from: "You", message: text, timestamp: new Date().toISOString() },
            ],
          }));
        }
        return;
      }

      if (page.type === "instagram") {
        setMessages((prev) => ({
          ...prev,
          [activeConversation.id]: [
            ...(prev[activeConversation.id] || []),
            { id: Date.now(), from: { username: "You" }, message: text },
          ],
        }));
        return;
      }

if (page.type === "facebook") {
  const userParticipant = activeConversation.participants?.data?.find(
    (p) => p.id !== page.id
  );
  if (!userParticipant) {
    return alert("No user ID found for this conversation");
  }

  const res = await fetch(
    `https://graph.facebook.com/v18.0/me/messages?access_token=${page.access_token}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: userParticipant.id },
        message: { text },
        messaging_type: "MESSAGE_TAG", // ✅ required if outside 24h window
        tag: "ACCOUNT_UPDATE", // or "CONFIRMED_EVENT_UPDATE" depending on case
      }),
    }
  );

  const result = await res.json();
  if (res.ok && result.message_id) {
    // optimistic update
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
  } else {
    console.error("Facebook send failed:", result);
    alert("Facebook send failed: " + (result.error?.message || "unknown error"));
  }
  return;
}


   if (page.type === "chatwidget") {
  await fetch(`/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: activeConversation.id,   // ✅ use id
      storeDomain: activeConversation.storeDomain || "myshop.com",
      message: text,
    }),
  });
  setMessages((prev) => ({
    ...prev,
    [activeConversation.id]: [
      ...(prev[activeConversation.id] || []),
      { from: { name: "You" }, message: text, created_time: new Date().toISOString() },
    ],
  }));
  return;
}

    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  /** ----------------- UI ----------------- **/
  return (
    <div style={{ display: "flex", height: "90vh", border: "1px solid #ddd" }}>
      {/* Conversations List */}
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
              {conv.participants?.data?.map((p) => p.name || p.username).join(", ") ||
                "Unnamed"}
            </div>
          ))
        )}
      </div>

      {/* Chat Box */}
      <div style={{ flex: 1, padding: 10, display: "flex", flexDirection: "column" }}>
        <h3>
          Chat:{" "}
          {activeConversation
            ? activeConversation.participants?.data
                ?.map((p) => p.name || p.username)
                .join(", ") || "Unnamed"
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
            messages[activeConversation.id].map((msg, idx) => (
              <div key={idx} style={{ marginBottom: 8 }}>
                <b>
                  {typeof msg.from === "string"
                    ? msg.from
                    : msg.from?.name || msg.from?.username || msg.sender || "User"}
                  :
                </b>{" "}
                {msg.text || msg.message}{" "}
                <small>{msg.timestamp || msg.created_time}</small>
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
