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

  // ✅ Fetch conversations when pages update
  useEffect(() => {
    if (!connectedPages.length) return;

    console.log("🔗 Connected Pages:", connectedPages);
    connectedPages.forEach((page) => {
      fetchConversations(page);
    });
  }, [connectedPages]);

  // ✅ Conversations fetcher
  const fetchConversations = async (page) => {
    try {
      const token = page.access_token;

      if (page.type === "instagram") {
        console.warn(
          "⚠️ Instagram does not allow fetching conversations via API. Messages only come via Webhooks."
        );
        return;
      }

      // FB Pages conversations
      const url = `https://graph.facebook.com/v18.0/${page.id}/conversations?fields=participants&access_token=${token}`;
      console.log("🌍 Fetching conversations from:", url);

      const res = await fetch(url);
      const data = await res.json();
      console.log("📥 Conversations Response:", data);

      if (Array.isArray(data?.data)) {
        setConversations((prev) => [
          ...prev.filter((c) => c.pageId !== page.id),
          ...data.data.map((c) => ({
            ...c,
            pageId: page.id,
            pageName: page.name,
            pageType: page.type,
          })),
        ]);
      }
    } catch (err) {
      console.error("❌ Error fetching conversations:", err);
    }
  };

  // ✅ Messages fetcher
  const fetchMessages = async (conversationId, page) => {
    try {
      let url;

      if (page.type === "instagram") {
        // Instagram business account messages
        const igBusinessId = page.igId || page.id;
        url = `https://graph.facebook.com/v18.0/${igBusinessId}/messages?fields=id,from,to,message,created_time&access_token=${page.access_token}`;
      } else {
        // Facebook Page conversation
        url = `https://graph.facebook.com/v18.0/${conversationId}/messages?fields=from,to,message,created_time&access_token=${page.access_token}`;
      }

      console.log("🌍 Fetching messages from:", url);
      const res = await fetch(url);
      const data = await res.json();
      console.log("📥 Messages Response:", data);

      if (Array.isArray(data?.data)) {
        setMessages((prev) => ({
          ...prev,
          [conversationId]: data.data,
        }));
      }
    } catch (err) {
      console.error("❌ Error fetching messages:", err);
    }
  };

  // ✅ Select conversation
  const handleSelectConversation = (conv) => {
    console.log("👉 Selected conversation:", conv);
    setActiveConversation(conv);

    const page = connectedPages.find((p) => p.id === conv.pageId);
    if (page) {
      fetchMessages(conv.id, page);
    }
  };

  // ✅ Send message
  const sendMessage = async (text) => {
    if (!activeConversation) return;

    const page = connectedPages.find((p) => p.id === activeConversation.pageId);
    if (!page) return;

    try {
      let url;
      let body;

      if (page.type === "instagram") {
        // Instagram DM send
        url = `https://graph.facebook.com/v18.0/${page.igId}/messages?access_token=${page.access_token}`;
        body = {
          recipient: { id: activeConversation.id }, // user id
          message: { text },
        };
      } else {
        // Facebook Page message
        url = `https://graph.facebook.com/v18.0/me/messages?access_token=${page.access_token}`;
        body = {
          recipient: { id: activeConversation.id },
          message: { text },
        };
      }

      console.log("✉️ Sending message:", url, body);

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      console.log("✅ Message Sent Response:", data);

      // Refresh chat
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
                background:
                  activeConversation?.id === conv.id ? "#eee" : "transparent",
              }}
              onClick={() => handleSelectConversation(conv)}
            >
              <b>[{conv.pageName}]</b>{" "}
              {conv.participants?.data?.map((p) => p.name).join(", ") ||
                conv.from?.username ||
                "Unnamed"}
            </div>
          ))
        )}
      </div>

      {/* RIGHT: Chat */}
      <div style={{ flex: 1, padding: 10, display: "flex", flexDirection: "column" }}>
        <h3>
          Chat:{" "}
          {activeConversation
            ? activeConversation.participants?.data
                ?.map((p) => p.name)
                .join(", ") || activeConversation.from?.username
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
            messages[activeConversation.id].map((msg) => (
              <div key={msg.id} style={{ marginBottom: 8 }}>
                <b>{msg.from?.name || msg.from?.username}:</b> {msg.message}{" "}
                <small>{msg.created_time}</small>
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
