import { useEffect, useContext, useState, useRef } from "react";
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

  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  const WHATSAPP_TOKEN =
    "YOUR_WHATSAPP_TOKEN";
  const WHATSAPP_PHONE_NUMBER_ID = "YOUR_WHATSAPP_PHONE_NUMBER_ID";

  // Fetch conversations when pages connect
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

      if (page.type === "instagram" || page.type === "facebook") {
        const url = `https://graph.facebook.com/v18.0/${page.id}/conversations?fields=participants&access_token=${page.access_token}`;
        const res = await fetch(url);
        const data = await res.json();
        if (!Array.isArray(data?.data)) return;

        const convs = data.data.map((c) => ({
          id: c.id,
          pageId: page.id,
          pageName: page.name,
          pageType: page.type,
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
        return;
      }
    } catch (err) {
      console.error("Error fetching conversations:", err);
    }
  };

  const fetchMessages = async (conv) => {
    try {
      if (!conv) return;
      const page = connectedPages.find((p) => p.id === conv.pageId);
      if (!page) return;

      if (page.type === "whatsapp") {
        const res = await fetch(`/whatsapp-messages?number=${conv.id}`);
        const data = await res.json();
        setMessages((prev) => ({ ...prev, [conv.id]: data }));
        return;
      }

      if (page.type === "instagram" || page.type === "facebook") {
        const url = `https://graph.facebook.com/v18.0/${conv.id}/messages?fields=from,to,message,created_time&access_token=${page.access_token}`;
        const res = await fetch(url);
        const data = await res.json();
        setMessages((prev) => ({
          ...prev,
          [conv.id]: Array.isArray(data?.data) ? data.data : [],
        }));
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  const handleSelectConversation = (conv) => {
    setActiveConversation(conv);
    fetchMessages(conv);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConversation || sendingMessage) return;
    setSendingMessage(true);

    const page = connectedPages.find((p) => p.id === activeConversation.pageId);
    if (!page) {
      alert("Page not found");
      setSendingMessage(false);
      return;
    }

    try {
      // --- WhatsApp ---
      if (page.type === "whatsapp") {
        await fetch(
          `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages?access_token=${WHATSAPP_TOKEN}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              to: activeConversation.userNumber,
              text: { body: newMessage },
            }),
          }
        );

        setMessages((prev) => ({
          ...prev,
          [activeConversation.id]: [
            ...(prev[activeConversation.id] || []),
            { from: "You", message: newMessage, timestamp: new Date().toISOString() },
          ],
        }));
        setNewMessage("");
        return;
      }

      // --- Instagram ---
      if (page.type === "instagram") {
        const recipient = activeConversation.participants?.data?.find(
          (p) => p.id !== page.igId
        );
        if (!recipient) {
          alert("No recipient found for Instagram");
          return;
        }

        await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${page.access_token}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messaging_product: "instagram",
            recipient: { id: recipient.id },
            message: { text: newMessage },
          }),
        });

        setMessages((prev) => ({
          ...prev,
          [activeConversation.id]: [
            ...(prev[activeConversation.id] || []),
            { from: "You", message: newMessage, timestamp: new Date().toISOString() },
          ],
        }));
        setNewMessage("");
        return;
      }

      // --- Facebook ---
      if (page.type === "facebook") {
        const recipient = activeConversation.participants?.data?.find(
          (p) => p.name !== page.name
        );
        if (!recipient) {
          alert("No recipient found for Facebook");
          return;
        }

        await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${page.access_token}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipient: { id: recipient.id },
            message: { text: newMessage },
            messaging_type: "MESSAGE_TAG",
            tag: "ACCOUNT_UPDATE",
          }),
        });

        setNewMessage("");
        fetchMessages(activeConversation);
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      alert("Failed to send message. Check console for details.");
    } finally {
      setSendingMessage(false);
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
              {conv.participants?.data?.map((p) => p.name || p.username).join(", ") || "Unnamed"}
            </div>
          ))
        )}
      </div>

      {/* Chat Box */}
      <div style={{ flex: 1, padding: 10, display: "flex", flexDirection: "column" }}>
        <h3>
          Chat:{" "}
          {activeConversation
            ? activeConversation.participants?.data?.map((p) => p.name || p.username).join(", ") ||
              "Unnamed"
            : "Select a conversation"}
        </h3>

        <div style={{ flex: 1, overflowY: "auto", border: "1px solid #ccc", marginBottom: 10, padding: 10 }}>
          {activeConversation &&
          messages[activeConversation.id] &&
          messages[activeConversation.id].length ? (
            messages[activeConversation.id].map((msg, idx) => (
              <div key={idx} style={{ marginBottom: 8 }}>
                <b>{typeof msg.from === "string" ? msg.from : msg.from?.name || msg.from?.username || "User"}:</b>{" "}
                {msg.text || msg.message} <small>{msg.timestamp || msg.created_time}</small>
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
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              style={{ flex: 1, padding: 8 }}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage();
              }}
            />
            <button onClick={sendMessage} disabled={sendingMessage}>
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
