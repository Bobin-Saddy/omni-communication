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

  // Fetch conversations whenever connectedPages update
  useEffect(() => {
    if (!connectedPages.length) return;
    connectedPages.forEach((page) => fetchConversations(page));
  }, [connectedPages]);

  // Fetch Conversations
  const fetchConversations = async (page) => {
    try {
      // WhatsApp
      if (page.type === "whatsapp") {
        if (!page.users || !page.users.length) return;

        const convs = page.users.map((u, index) => ({
          id: `wa-${index}`,
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

      const token = page.access_token;

      // Instagram
      if (page.type === "instagram") {
        const url = `https://graph.facebook.com/v18.0/${page.id}/conversations?fields=participants,messages{from,to,message,created_time}&access_token=${token}`;
        const res = await fetch(url);
        const data = await res.json();

        if (Array.isArray(data?.data) && data.data.length) {
          setConversations((prev) => [
            ...prev.filter((c) => c.pageId !== page.id),
            ...data.data.map((c) => ({
              ...c,
              pageId: page.id,
              pageName: page.name,
              pageType: "instagram",
            })),
          ]);
        } else {
          setConversations((prev) => [
            ...prev.filter((c) => c.pageId !== page.id),
            {
              id: `${page.id}-placeholder`,
              pageId: page.id,
              pageName: page.name,
              pageType: "instagram",
              participants: { data: [{ name: "📸 Instagram Inbox" }] },
            },
          ]);
        }
        return;
      }

      // Facebook
      const url = `https://graph.facebook.com/v18.0/${page.id}/conversations?fields=participants&access_token=${token}`;
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

  // Fetch messages
  const fetchMessages = async (conversationId, page) => {
    try {
      // WhatsApp placeholder
      if (page.type === "whatsapp") {
        setMessages((prev) => ({
          ...prev,
          [conversationId]: [
            ...(prev[conversationId] || []),
            { id: Date.now(), from: { username: "You" }, message: "Start chatting on WhatsApp 📱" },
          ],
        }));
        return;
      }

      const token = page.access_token;

      // Instagram
      if (page.type === "instagram") {
        if (conversationId.includes("placeholder")) return;

        const url = `https://graph.facebook.com/v18.0/${conversationId}/messages?fields=from,to,message,created_time&access_token=${token}`;
        const res = await fetch(url);
        const data = await res.json();

        if (Array.isArray(data?.data)) {
          setMessages((prev) => ({ ...prev, [conversationId]: data.data }));
        }
        return;
      }

      // Facebook
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

  // Select conversation
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
      // WhatsApp: local + server
      if (page.type === "whatsapp") {
        setMessages((prev) => ({
          ...prev,
          [activeConversation.id]: [
            ...(prev[activeConversation.id] || []),
            { id: Date.now(), from: { username: "You" }, message: text },
          ],
        }));

        // Call server to send WhatsApp message
        await fetch("/send-whatsapp-message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ to: activeConversation.userNumber, message: text }),
        });
        return;
      }

      // Instagram placeholder
      if (page.type === "instagram") {
        setMessages((prev) => ({
          ...prev,
          [activeConversation.id]: [
            ...(prev[activeConversation.id] || []),
            { id: Date.now(), from: { username: "me" }, message: text },
          ],
        }));
        return;
      }

      // Facebook send
      const url = `https://graph.facebook.com/v18.0/me/messages?access_token=${page.access_token}`;
      const body = { recipient: { id: activeConversation.id }, message: { text } };
      await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      fetchMessages(activeConversation.id, page);
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
              {conv.participants?.data?.map((p) => p.name).join(", ") || conv.from?.username || "Unnamed"}
            </div>
          ))
        )}
      </div>

      {/* RIGHT: Chat */}
      <div style={{ flex: 1, padding: 10, display: "flex", flexDirection: "column" }}>
        <h3>
          Chat:{" "}
          {activeConversation
            ? activeConversation.participants?.data?.map((p) => p.name).join(", ") || activeConversation.from?.username
            : "Select a conversation"}
        </h3>

        <div style={{ flex: 1, overflowY: "auto", border: "1px solid #ccc", marginBottom: 10, padding: 10 }}>
          {activeConversation && messages[activeConversation.id] && messages[activeConversation.id].length ? (
            messages[activeConversation.id].map((msg) => (
              <div key={msg.id} style={{ marginBottom: 8 }}>
                <b>{msg.from?.name || msg.from?.username}:</b> {msg.message}{" "}
                <small>{msg.created_time || ""}</small>
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
