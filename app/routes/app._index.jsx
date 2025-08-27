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
    "EAAHvZAZB8ZCmugBPTKCOgb1CojZAJ28WWZAgmM9SiqSYFHgCZBfgvVcd9KF2I61b2wj4wfvX7PHUnnHoRsLOe7FuiY1qg5zrZCxMg6brDnSfeQKtkcAdB8fzIE9RoCDYtHGXhhoQOkF5JZBLk8RrsBY3eh4MLXxZBXR0pZBUQwH3ixqFHONx68DhvB9BsdnNAJXyMraXkxUqIO2mPyC3bf5S2eeSg1tbJhGBB2uYSO02cbJwZDZD";
  const WHATSAPP_PHONE_NUMBER_ID = "106660072463312";

  useEffect(() => {
    if (!connectedPages.length) return;
    connectedPages.forEach((page) => fetchConversations(page));
  }, [connectedPages]);

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
          participants: { data: [{ name: u.name || u.input }] },
          userNumber: u.input,
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

  const fetchMessages = async (conversationId, page) => {
    try {
      if (page.type === "whatsapp") {
        // Fetch messages via WhatsApp Cloud API
        const res = await fetch(
          `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages?access_token=${WHATSAPP_TOKEN}`
        );
        const data = await res.json();

        const filtered = data?.data?.filter((m) => m.from === conversationId) || [];

        setMessages((prev) => ({ ...prev, [conversationId]: filtered }));
        return;
      }

      const token = page.access_token;

      // Instagram
      if (page.type === "instagram") {
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
            { id: Date.now(), from: { username: "You" }, message: text },
          ],
        }));
        return;
      }

      // Instagram and Facebook sending placeholder
      setMessages((prev) => ({
        ...prev,
        [activeConversation.id]: [
          ...(prev[activeConversation.id] || []),
          { id: Date.now(), from: { username: "me" }, message: text },
        ],
      }));
    } catch (err) {
      console.error("❌ Error sending message:", err);
    }
  };

  return (
    <div style={{ display: "flex", height: "90vh", border: "1px solid #ddd" }}>
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
                <b>{msg.from?.name || msg.from?.username}:</b> {msg.message || msg.text?.body}{" "}
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
