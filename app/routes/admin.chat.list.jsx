import { useState, useEffect, useRef } from "react";

export default function AdminChatList() {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  // ✅ Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // ✅ Fetch conversations on mount
  useEffect(() => {
    fetch("/api/conversations")
      .then((res) => res.json())
      .then((data) => setConversations(data))
      .catch((err) => console.error("Error fetching conversations:", err));
  }, []);

  // ✅ Fetch messages when conversation changes
  useEffect(() => {
    if (!selectedConversation) return;

    fetch(`/api/conversations/${selectedConversation.id}/messages`)
      .then((res) => res.json())
      .then((data) => {
        setMessages(data);
        scrollToBottom();
      })
      .catch((err) => console.error("Error fetching messages:", err));
  }, [selectedConversation]);

  // ✅ Send new message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const msg = {
      content: newMessage,
      sender: "admin", // fixed since this is admin panel
      conversationId: selectedConversation.id,
    };

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(msg),
      });

      if (!res.ok) throw new Error("Failed to send message");

      const savedMsg = await res.json();
      setMessages((prev) => [...prev, savedMsg]);
      setNewMessage("");
      scrollToBottom();
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  return (
    <div className="social-chat-dashboard" style={{ fontFamily: "Arial, sans-serif", maxWidth: 1200, margin: "auto" }}>
      <h1 style={{ textAlign: "center", margin: "20px 0" }}>📱 Admin Chat Dashboard</h1>

      <div style={{ display: "flex", gap: 20 }}>
        {/* ✅ Conversation List */}
        <div style={{ flex: 1, border: "1px solid #ddd", borderRadius: 10, padding: 10 }}>
          <h2>Conversations</h2>
          {conversations.map((c) => (
            <div
              key={c.id}
              onClick={() => setSelectedConversation(c)}
              style={{
                padding: "10px",
                margin: "5px 0",
                cursor: "pointer",
                background: selectedConversation?.id === c.id ? "#e3f2fd" : "#f9f9f9",
                borderRadius: 8,
              }}
            >
              <strong>{c.userName || `Conversation #${c.id}`}</strong>
            </div>
          ))}
        </div>

        {/* ✅ Messages Panel */}
        <div style={{ flex: 2, border: "1px solid #ddd", borderRadius: 10, padding: 10, display: "flex", flexDirection: "column" }}>
          <h2>Messages</h2>
          <div style={{ flex: 1, overflowY: "auto", padding: 10, background: "#fafafa", borderRadius: 8 }}>
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  textAlign: m.sender === "admin" ? "right" : "left",
                  marginBottom: 10,
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    padding: "8px 12px",
                    borderRadius: 16,
                    background: m.sender === "admin" ? "#1976d2" : "#e0e0e0",
                    color: m.sender === "admin" ? "white" : "black",
                  }}
                >
                  {m.content}
                </span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* ✅ Send Message Box */}
          {selectedConversation && (
            <div style={{ display: "flex", marginTop: 10 }}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Type a message..."
                style={{ flex: 1, padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
              />
              <button
                onClick={handleSendMessage}
                style={{ marginLeft: 10, padding: "10px 20px", background: "#1976d2", color: "white", border: "none", borderRadius: 8 }}
              >
                Send
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
