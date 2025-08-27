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

  const WHATSAPP_TOKEN = "EAAHvZAZB8ZCmugBPTKCOgb1CojZAJ28WWZAgmM9SiqSYFHgCZBfgvVcd9KF2I61b2wj4wfvX7PHUnnHoRsLOe7FuiY1qg5zrZCxMg6brDnSfeQKtkcAdB8fzIE9RoCDYtHGXhhoQOkF5JZBLk8RrsBY3eh4MLXxZBXR0pZBUQwH3ixqFHONx68DhvB9BsdnNAJXyMraXkxUqIO2mPyC3bf5S2eeSg1tbJhGBB2uYSO02cbJwZDZD";
  const WHATSAPP_PHONE_NUMBER_ID = "106660072463312";

  // Load conversations when connected pages change
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
        const url = `https://graph.facebook.com/v18.0/${page.id}/conversations?fields=participants,messages{from,to,message,created_time}&access_token=${page.access_token}`;
        const res = await fetch(url);
        const data = await res.json();
        if (Array.isArray(data?.data)) {
          const convs = data.data.map((c) => ({
            ...c,
            pageId: page.id,
            pageName: page.name,
            pageType: "instagram",
          }));
          setConversations((prev) => [
            ...prev.filter((c) => c.pageId !== page.id),
            ...convs,
          ]);
        }
        return;
      }

      if (page.type === "facebook") {
        const url = `https://graph.facebook.com/v18.0/${page.id}/conversations?fields=participants&access_token=${page.access_token}`;
        const res = await fetch(url);
        const data = await res.json();
        if (Array.isArray(data?.data)) {
          const convs = data.data.map((c) => ({
            ...c,
            pageId: page.id,
            pageName: page.name,
            pageType: "facebook",
          }));
          setConversations((prev) => [
            ...prev.filter((c) => c.pageId !== page.id),
            ...convs,
          ]);
        }
        return;
      }
    } catch (err) {
      console.error("Error fetching conversations:", err);
    }
  };

  const fetchMessages = async (conversationId, page) => {
    try {
      if (page.type === "whatsapp") {
        const res = await fetch(`/whatsapp-messages?number=${conversationId}`);
        const data = await res.json();
        setMessages((prev) => ({ ...prev, [conversationId]: data }));
        return;
      }

      if (page.type === "instagram") {
        if (conversationId.includes("placeholder")) {
          setMessages((prev) => ({
            ...prev,
            [conversationId]: [
              {
                id: "local-1",
                from: { username: "system" },
                message: "Start chatting on Instagram 📸",
              },
            ],
          }));
          return;
        }
        const url = `https://graph.facebook.com/v18.0/${conversationId}/messages?fields=from,to,message,created_time&access_token=${page.access_token}`;
        const res = await fetch(url);
        const data = await res.json();
        setMessages((prev) => ({
          ...prev,
          [conversationId]: Array.isArray(data?.data) ? data.data : [],
        }));
        return;
      }

      if (page.type === "facebook") {
        const url = `https://graph.facebook.com/v18.0/${conversationId}/messages?fields=from,to,message,created_time&access_token=${page.access_token}`;
        const res = await fetch(url);
        const data = await res.json();
        setMessages((prev) => ({
          ...prev,
          [conversationId]: Array.isArray(data?.data) ? data.data : [],
        }));
        return;
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  const handleSelectConversation = (conv) => {
    setActiveConversation(conv);
    const page = connectedPages.find((p) => p.id === conv.pageId);
    if (!page) return;
    fetchMessages(conv.id, page);
  };

  const sendMessage = async (text) => {
    if (!activeConversation) return;
    const page = connectedPages.find((p) => p.id === activeConversation.pageId);
    if (!page) return;

    try {
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
            { from: "You", text: text, timestamp: new Date().toISOString() },
          ],
        }));
        return;
      }

      // Instagram / Facebook send logic
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

      if (page.type === "facebook") {
        const url = `https://graph.facebook.com/v18.0/me/messages?access_token=${page.access_token}`;
        const body = { recipient: { id: activeConversation.id }, message: { text } };
        await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        fetchMessages(activeConversation.id, page);
        return;
      }
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

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
              {conv.participants?.data?.map((p) => p.name).join(", ") || conv.from?.username || "Unnamed"}
            </div>
          ))
        )}
      </div>

      {/* Chat Box */}
      <div style={{ flex: 1, padding: 10, display: "flex", flexDirection: "column" }}>
        <h3>
          Chat:{" "}
          {activeConversation
            ? activeConversation.participants?.data?.map((p) => p.name).join(", ") || activeConversation.from?.username
            : "Select a conversation"}
        </h3>

        <div style={{ flex: 1, overflowY: "auto", border: "1px solid #ccc", marginBottom: 10, padding: 10 }}>
          {activeConversation && messages[activeConversation.id] && messages[activeConversation.id].length ? (
            messages[activeConversation.id].map((msg, idx) => (
              <div key={idx} style={{ marginBottom: 8 }}>
                <b>{msg.from || msg.from?.name}:</b> {msg.text || msg.message}{" "}
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
