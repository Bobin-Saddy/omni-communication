import { useState, useEffect, useRef } from "react";

export default function SocialChatDashboard({
  selectedPage,
  conversations,
  selectedConversation,
  setSelectedConversation,
  messages,
  setMessages,
  newMessage,
  setNewMessage,
  sendMessage,
  loadingConversations,
  sendingMessage,
}) {
  const messagesEndRef = useRef(null);

  // Auto scroll messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div
      className="social-chat-dashboard"
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
      <h1
        style={{
          textAlign: "center",
          marginBottom: "30px",
          fontSize: "36px",
          fontWeight: "900",
          color: "#0f172a",
          letterSpacing: "-0.7px",
          textShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        ✨ Omni-Communication Dashboard
      </h1>

      {/* Conversations Layout */}
      {selectedPage ? (
        <div
          style={{
            display: "flex",
            height: 680,
            border: "1px solid #e5e7eb",
            borderRadius: 24,
            overflow: "hidden",
            background: "#fff",
            boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
          }}
        >
          {/* Conversations List */}
          <div
            style={{
              width: "28%",
              borderRight: "1px solid #e5e7eb",
              overflowY: "auto",
              background: "#fff",
            }}
          >
            <div
              style={{
                padding: "14px 16px",
                borderBottom: "1px solid #e5e7eb",
                background: "#f3f4f6",
                fontWeight: "700",
                color: "#0f172a",
              }}
            >
              Conversations
            </div>

            {loadingConversations ? (
              <div style={{ padding: 14, color: "#6b7280" }}>Loading...</div>
            ) : conversations.length === 0 ? (
              <div style={{ padding: 14, color: "#6b7280" }}>
                No conversations
              </div>
            ) : (
              conversations.map((conv) => {
                const prettyName =
                  selectedPage?.type === "instagram"
                    ? conv.userName || "IG User"
                    : selectedPage?.type === "whatsapp"
                    ? conv.userName || conv.userNumber || "WhatsApp User"
                    : selectedPage?.type === "widget"
                    ? conv.userName || "Widget User"
                    : (conv.participants?.data
                        ?.map((p) => p.name)
                        .filter(Boolean)
                        .join(", ")) || "Facebook User";

                const preview =
                  conv.lastMessage ||
                  conv.snippet ||
                  conv.preview ||
                  conv.last_text ||
                  "";

                return (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    style={{
                      padding: "12px 16px",
                      cursor: "pointer",
                      backgroundColor:
                        selectedConversation?.id === conv.id
                          ? "#dbeafe"
                          : "transparent",
                      borderBottom: "1px solid #eee",
                      transition: "all 0.25s ease",
                    }}
                  >
                    <div style={{ fontWeight: 600, color: "#1e293b" }}>
                      {prettyName}
                    </div>
                    {preview && (
                      <div
                        style={{
                          fontSize: 13,
                          color: "#64748b",
                          marginTop: 2,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {preview}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Chat Area */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              background: "#f1f5f9",
            }}
          >
            {/* Chat Header */}
            <div
              style={{
                padding: "14px 16px",
                borderBottom: "1px solid #e5e7eb",
                background: "#ffffff",
                fontWeight: "800",
                fontSize: 16,
              }}
            >
              {selectedConversation
                ? selectedConversation.userName ||
                  selectedConversation.participants?.data?.[0]?.name ||
                  "User"
                : "Chat"}
            </div>

            {/* Messages */}
            <div
              style={{
                flex: 1,
                padding: 20,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              {(messages[selectedConversation?.id] || []).map((msg) => {
                const fromId = msg.from?.id || msg.from;
                const isMe = fromId === "me" || fromId === selectedPage?.id;

                return (
                  <div
                    key={msg.id}
                    style={{
                      display: "flex",
                      justifyContent: isMe ? "flex-end" : "flex-start",
                    }}
                  >
                    <div
                      style={{
                        padding: "12px 16px",
                        borderRadius: 20,
                        maxWidth: "70%",
                        fontSize: 14,
                        lineHeight: "20px",
                        background: isMe ? "#2563eb" : "#ffffff",
                        color: isMe ? "#ffffff" : "#0f172a",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                      }}
                    >
                      {!isMe && (
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            marginBottom: 4,
                            color: "#334155",
                          }}
                        >
                          {msg.displayName || msg.from?.name || "User"}
                        </div>
                      )}
                      <div>{msg.message || msg.text || msg.body}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div
              style={{
                display: "flex",
                padding: 14,
                borderTop: "1px solid #e5e7eb",
                background: "#fff",
              }}
            >
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                style={{
                  flex: 1,
                  padding: "14px 18px",
                  borderRadius: 25,
                  border: "1px solid #d1d5db",
                  fontSize: 15,
                  outline: "none",
                }}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                disabled={sendingMessage}
              />
              <button
                onClick={sendMessage}
                disabled={sendingMessage || !newMessage.trim()}
                style={{
                  marginLeft: 12,
                  padding: "12px 22px",
                  background: sendingMessage
                    ? "#9ca3af"
                    : "linear-gradient(135deg,#2563eb,#1e40af)",
                  color: "white",
                  border: "none",
                  borderRadius: 50,
                  fontWeight: "600",
                  cursor: sendingMessage ? "not-allowed" : "pointer",
                }}
              >
                {sendingMessage ? "..." : "➤"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{
            height: 600,
            border: "1px solid #e5e7eb",
            borderRadius: 18,
            background: "#f8fafc",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#64748b",
            fontSize: 16,
            fontWeight: "500",
          }}
        >
          👈 Connect a platform first
        </div>
      )}
    </div>
  );
}
