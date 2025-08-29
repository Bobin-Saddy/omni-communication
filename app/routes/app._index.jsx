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

  /** ----------------- LOAD CONVERSATIONS WHEN PAGES CONNECT ----------------- **/
  useEffect(() => {
    if (!connectedPages.length) {
      setConversations([]);
      setMessages({});
      setActiveConversation(null);
      return;
    }

    // ✅ remove disconnected page conversations/messages
    setConversations((prev) =>
      prev.filter((c) => connectedPages.some((p) => p.id === c.pageId))
    );

    // ✅ fetch conversations for each connected page
    connectedPages.forEach((page) => fetchConversations(page));
  }, [connectedPages]);

  /** ----------------- FETCH CONVERSATIONS ----------------- **/
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
      }

      if (page.type === "instagram") {
        const res = await fetch(
          `https://graph.facebook.com/v18.0/${page.pageId}/conversations?platform=instagram&fields=id,participants&access_token=${page.access_token}`
        );
        const data = await res.json();
        if (!Array.isArray(data?.data)) return;

        const convs = data.data.map((conv) => {
          const other =
            conv.participants?.data.find(
              (p) => p.id !== page.igId && p.id !== page.pageId
            ) || {};
          return {
            id: conv.id,
            pageId: page.id,
            pageName: page.name,
            pageType: "instagram",
            participants: { data: [{ id: other.id, name: other.name || "IG User" }] },
            recipientId: other.id,
          };
        });

        setConversations((prev) => [
          ...prev.filter((c) => c.pageId !== page.id),
          ...convs,
        ]);
      }

      if (page.type === "facebook") {
        const res = await fetch(
          `https://graph.facebook.com/v18.0/${page.id}/conversations?fields=participants&access_token=${page.access_token}`
        );
        const data = await res.json();
        if (!Array.isArray(data?.data)) return;

        const convs = data.data.map((c) => ({
          id: c.id,
          pageId: page.id,
          pageName: page.name,
          pageType: "facebook",
          participants: {
            data: c.participants?.data?.map((p) => ({
              name: p.name,
              id: p.id,
            })),
          },
        }));

        setConversations((prev) => [
          ...prev.filter((c) => c.pageId !== page.id),
          ...convs,
        ]);
      }

      if (page.type === "chatwidget") {
        const res = await fetch(`/api/chat?widget=true`);
        const data = await res.json();
        if (!Array.isArray(data?.sessions)) return;

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
    } catch (err) {
      console.error("Error fetching conversations:", err);
    }
  };

  /** ----------------- FETCH MESSAGES WHEN CONVERSATION SELECTED ----------------- **/
  useEffect(() => {
    if (!activeConversation) return;

    fetchMessages(activeConversation);

    if (activeConversation.pageType === "chatwidget") {
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

  const fetchMessages = async (conv) => {
    try {
      if (conv.pageType === "facebook" || conv.pageType === "instagram") {
        const res = await fetch(
          `https://graph.facebook.com/v18.0/${conv.id}/messages?fields=from,to,message,created_time&access_token=${
            connectedPages.find((p) => p.id === conv.pageId).access_token
          }`
        );
        const data = await res.json();
        if (Array.isArray(data?.data)) {
          setMessages((prev) => ({ ...prev, [conv.id]: data.data.reverse() }));
        }
      }

      if (conv.pageType === "whatsapp") {
        const res = await fetch(`/whatsapp-messages?number=${conv.userNumber}`);
        const data = await res.json();
        setMessages((prev) => ({ ...prev, [conv.id]: data || [] }));
      }

      if (conv.pageType === "chatwidget") {
        const res = await fetch(
          `/api/chat/messages?sessionId=${conv.sessionId}&storeDomain=${conv.storeDomain}`
        );
        const data = await res.json();
        setMessages((prev) => ({ ...prev, [conv.id]: data || [] }));
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  /** ----------------- SEND MESSAGE ----------------- **/
  const sendMessage = async (text) => {
    if (!activeConversation) return;

    const conv = activeConversation;

    if (conv.pageType === "facebook" || conv.pageType === "instagram") {
      await fetch(
        `https://graph.facebook.com/v18.0/me/messages?access_token=${
          connectedPages.find((p) => p.id === conv.pageId).access_token
        }`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipient: { id: conv.recipientId },
            message: { text },
          }),
        }
      );
    }

    if (conv.pageType === "whatsapp") {
      await fetch("/send-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number: conv.userNumber, text }),
      });
    }

    if (conv.pageType === "chatwidget") {
      await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: conv.sessionId,
          storeDomain: conv.storeDomain,
          text,
        }),
      });
    }

    setMessages((prev) => ({
      ...prev,
      [conv.id]: [...(prev[conv.id] || []), { from: "me", text }],
    }));
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
                background:
                  activeConversation?.id === conv.id ? "#eee" : "transparent",
              }}
              onClick={() => setActiveConversation(conv)}
            >
              <b>[{conv.pageName}]</b>{" "}
              {conv.participants?.data?.map((p) => p.name).join(", ")}
            </div>
          ))
        )}
      </div>

      {/* Chat Box */}
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
            messages[activeConversation.id].map((msg, idx) => (
              <div key={idx} style={{ marginBottom: 8 }}>
                <b>{msg.from?.name || msg.from || "User"}:</b> {msg.text || msg.message}
                <small style={{ marginLeft: 6 }}>
                  {msg.timestamp || msg.created_time}
                </small>
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
