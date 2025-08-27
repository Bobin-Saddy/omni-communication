import { useState, useEffect, useRef } from "react";
import { useAppContext } from "./AppContext";


export default function Index() {
  const {
    fbPages,
    igPages,
    fbConnected,
    igConnected,
    fetchFacebookPages,
    fetchInstagramAccounts,
    pageAccessTokens,
  } = useAppContext();

  const [activeTab, setActiveTab] = useState("settings");
  const [selectedPage, setSelectedPage] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  const messagesEndRef = useRef(null);

  // Auto scroll messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // ✅ Fetch conversations when a page is selected
  const fetchConversations = async (page) => {
    setLoadingConversations(true);
    try {
      const token = pageAccessTokens[page.id];
      setSelectedPage(page);
      setSelectedConversation(null);
      setMessages([]);

      let url = `https://graph.facebook.com/v18.0/${page.id}/conversations?fields=participants&access_token=${token}`;
      if (page.type === "instagram") {
        url = `https://graph.facebook.com/v18.0/${page.id}/conversations?platform=instagram&fields=participants&access_token=${token}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.error) {
        console.error("Error fetching conversations:", data.error);
        setConversations([]);
      } else {
        setConversations(data.data || []);
      }
    } catch (err) {
      console.error("Fetch conversation error:", err);
    }
    setLoadingConversations(false);
  };

  // ✅ Fetch messages for a conversation
  const fetchMessages = async (conversationId) => {
    if (!selectedPage) return;
    try {
      const token = pageAccessTokens[selectedPage.id];
      const url = `https://graph.facebook.com/v18.0/${conversationId}?fields=messages{message,from,to,created_time}&access_token=${token}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.error) {
        console.error("Error fetching messages:", data.error);
        setMessages([]);
      } else {
        setMessages(data.messages?.data || []);
      }
    } catch (err) {
      console.error("Fetch messages error:", err);
    }
  };

  // ✅ Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !selectedPage) return;
    setSendingMessage(true);

    try {
      const token = pageAccessTokens[selectedPage.id];
      const url = `https://graph.facebook.com/v18.0/me/messages?access_token=${token}`;

      const body = {
        messaging_type: "RESPONSE",
        recipient: {
          id: selectedConversation.participants?.data?.[0]?.id,
        },
        message: {
          text: newMessage,
        },
      };

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (data.error) {
        console.error("Error sending message:", data.error);
      } else {
        setMessages((prev) => [
          ...prev,
          { message: newMessage, from: { name: "You" }, created_time: new Date().toISOString() },
        ]);
        setNewMessage("");
      }
    } catch (err) {
      console.error("Send message error:", err);
    }
    setSendingMessage(false);
  };

  return (
    <div
      style={{
        fontFamily: "Inter, Arial, sans-serif",
        maxWidth: 1400,
        margin: "auto",
        padding: "20px",
        background: "linear-gradient(135deg, #e0e7ff, #fef2f2)",
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "20px" }}>
        Social Chat Dashboard
      </h1>

      {/* Tabs */}
      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={() => setActiveTab("settings")}
          style={{
            padding: "10px 20px",
            marginRight: "10px",
            background: activeTab === "settings" ? "#4f46e5" : "#e5e7eb",
            color: activeTab === "settings" ? "white" : "black",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
          }}
        >
          Settings
        </button>
        <button
          onClick={() => setActiveTab("conversations")}
          style={{
            padding: "10px 20px",
            background: activeTab === "conversations" ? "#4f46e5" : "#e5e7eb",
            color: activeTab === "conversations" ? "white" : "black",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
          }}
        >
          Conversations
        </button>
      </div>

      {/* Settings Tab */}
      {activeTab === "settings" && <Settings />}

      {/* Conversations Tab */}
      {activeTab === "conversations" && (
        <div style={{ display: "flex", gap: "20px" }}>
          {/* Sidebar: Pages */}
          <div style={{ width: "30%", background: "white", padding: "10px", borderRadius: "8px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "600" }}>Pages</h2>
            {fbPages.map((page) => (
              <div
                key={page.id}
                style={{
                  padding: "10px",
                  marginTop: "5px",
                  cursor: "pointer",
                  background: selectedPage?.id === page.id ? "#dbeafe" : "#f9fafb",
                  borderRadius: "6px",
                }}
                onClick={() => fetchConversations({ ...page, type: "facebook" })}
              >
                📘 {page.name}
              </div>
            ))}
            {igPages.map((page) => (
              <div
                key={page.id}
                style={{
                  padding: "10px",
                  marginTop: "5px",
                  cursor: "pointer",
                  background: selectedPage?.id === page.id ? "#dbeafe" : "#f9fafb",
                  borderRadius: "6px",
                }}
                onClick={() => fetchConversations({ ...page, type: "instagram" })}
              >
                📸 {page.username || "Instagram Account"}
              </div>
            ))}
          </div>

          {/* Sidebar: Conversations */}
          <div style={{ width: "30%", background: "white", padding: "10px", borderRadius: "8px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "600" }}>Conversations</h2>
            {loadingConversations ? (
              <p>Loading conversations...</p>
            ) : (
              conversations.map((convo) => (
                <div
                  key={convo.id}
                  style={{
                    padding: "10px",
                    marginTop: "5px",
                    cursor: "pointer",
                    background: selectedConversation?.id === convo.id ? "#dbeafe" : "#f9fafb",
                    borderRadius: "6px",
                  }}
                  onClick={() => {
                    setSelectedConversation(convo);
                    fetchMessages(convo.id);
                  }}
                >
                  💬 {convo.participants?.data?.map((p) => p.name).join(", ")}
                </div>
              ))
            )}
          </div>

          {/* Chat Window */}
          <div style={{ flex: 1, background: "white", padding: "10px", borderRadius: "8px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "600" }}>Messages</h2>
            <div style={{ height: "400px", overflowY: "auto", padding: "10px", border: "1px solid #e5e7eb" }}>
              {messages.map((msg, index) => (
                <div key={index} style={{ marginBottom: "10px" }}>
                  <strong>{msg.from?.name || "Unknown"}:</strong> {msg.message}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div style={{ marginTop: "10px", display: "flex", gap: "10px" }}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                style={{ flex: 1, padding: "8px", border: "1px solid #ccc", borderRadius: "6px" }}
              />
              <button
                onClick={sendMessage}
                disabled={sendingMessage}
                style={{
                  padding: "8px 16px",
                  background: "#4f46e5",
                  color: "white",
                  borderRadius: "6px",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {sendingMessage ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
