import React, { useState, useEffect } from "react";

const SocialChatDashboard = () => {
  const [fbConnected, setFbConnected] = useState(false);
  const [igConnected, setIgConnected] = useState(false);
  const [waConnected, setWaConnected] = useState(false);
  const [selectedPage, setSelectedPage] = useState(null);
  const [fbPages, setFbPages] = useState([]);
  const [igPages, setIgPages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [showWaConnectModal, setShowWaConnectModal] = useState(false);

  // Simulated login functions
  const handleFacebookLogin = () => {
    setFbConnected(true);
    setFbPages([{ id: "fb1", name: "FB Page 1", type: "facebook" }]);
  };

  const handleInstagramLogin = () => {
    setIgConnected(true);
    setIgPages([{ id: "ig1", name: "IG Page 1", type: "instagram" }]);
  };

  const handleWhatsAppConnect = () => {
    setSelectedPage({ id: "wa1", name: "WhatsApp", type: "whatsapp" });
    setShowWaConnectModal(false);
    setConversations([{ id: "wa_conv1", userName: "User WA", businessName: "Biz WA" }]);
  };

  const fetchConversations = (page) => {
    setSelectedPage(page);
    setSelectedConversation(null);
    setMessages([]);
    setConversations([
      {
        id: "conv1",
        participants: {
          data: [
            { id: "1", name: "Customer A" },
            { id: "2", name: page.name },
          ],
        },
        businessName: "Biz A",
        userName: "User A",
      },
    ]);
  };

  const fetchMessages = (conversation) => {
    setSelectedConversation(conversation);
    setMessages([
      {
        id: "msg1",
        from: { id: "1", name: "Customer A" },
        displayName: "Customer A",
        message: "Hello!",
        created_time: new Date(),
      },
      {
        id: "msg2",
        from: { id: "me" },
        displayName: "You",
        message: "Hi there!",
        created_time: new Date(),
      },
    ]);
  };

  const sendMessage = () => {
    if (newMessage.trim() === "") return;
    const newMsg = {
      id: `msg-${Date.now()}`,
      from: { id: "me" },
      displayName: "You",
      message: newMessage,
      created_time: new Date(),
    };
    setMessages((prev) => [...prev, newMsg]);
    setNewMessage("");
  };

  return (
    <div className="social-chat-dashboard">
      <div className="page-title">
        <h1>📱 Social Chat Dashboard</h1>
      </div>

      <div className="card for-box">
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <button
            onClick={handleFacebookLogin}
            style={{
              backgroundColor: "#000000",
              color: "white",
              padding: "10px",
              border: "none",
              borderRadius: "4px",
              fontSize: "16px",
              fontWeight: "500",
            }}
            disabled={fbConnected}
            className="checkfbb"
          >
            Connect Facebook
          </button>

          <div style={{ marginTop: 10 }}>
            <button
              style={{
                backgroundColor: "#000000",
                color: "white",
                padding: "10px",
                border: "none",
                borderRadius: "4px",
                fontSize: "16px",
                fontWeight: "500",
              }}
              onClick={handleInstagramLogin}
              disabled={igConnected}
            >
              Connect Instagram
            </button>
          </div>

          <div style={{ marginTop: 10 }}>
            <button
              style={{
                backgroundColor: "#000000",
                color: "white",
                padding: "10px",
                border: "none",
                borderRadius: "4px",
                fontSize: "16px",
                fontWeight: "500",
              }}
              onClick={() => setShowWaConnectModal(true)}
              disabled={waConnected}
            >
              Connect WhatsApp
            </button>
          </div>
        </div>

        {selectedPage && (
          <div
            style={{
              display: "flex",
              height: "650px",
              border: "1px solid #ccc",
              borderRadius: 8,
              overflow: "hidden",
              width: "100%",
            }}
          >
            {/* Pages Sidebar */}
            <div style={{ width: "22%", borderRight: "1px solid #eee", overflowY: "auto" }}>
              <div style={{ padding: 12, borderBottom: "1px solid #ddd" }}>
                <h3>Pages</h3>
              </div>
              {[...fbPages, ...igPages].map((page) => (
                <div
                  key={page.id}
                  onClick={() => fetchConversations(page)}
                  style={{
                    padding: 12,
                    cursor: "pointer",
                    backgroundColor: selectedPage?.id === page.id ? "#e3f2fd" : "white",
                  }}
                >
                  <span>{page.name} ({page.type})</span>
                </div>
              ))}
              {waConnected && (
                <div
                  onClick={handleWhatsAppConnect}
                  style={{
                    padding: 12,
                    cursor: "pointer",
                    backgroundColor: selectedPage?.type === "whatsapp" ? "#e3f2fd" : "white",
                  }}
                >
                  <span>WhatsApp</span>
                </div>
              )}
            </div>

            {/* Conversations List */}
            <div style={{ width: "28%", borderRight: "1px solid #eee", overflowY: "auto" }}>
              <div style={{ padding: 12, borderBottom: "1px solid #ddd" }}>
                <h3>Conversations</h3>
              </div>
              {conversations.length === 0 && <div style={{ padding: 12 }}>No conversations available.</div>}
              {conversations.map((conv) => {
                const name =
                  selectedPage?.type === "instagram"
                    ? `${conv.businessName} ↔️ ${conv.userName}`
                    : selectedPage?.type === "whatsapp"
                    ? "WhatsApp User"
                    : conv.participants?.data
                        ?.filter((p) => p.name !== selectedPage.name)
                        .map((p) => p.name)
                        .join(", ");
                return (
                  <div
                    key={conv.id}
                    onClick={() => fetchMessages(conv)}
                    style={{
                      padding: 12,
                      cursor: "pointer",
                      backgroundColor: selectedConversation?.id === conv.id ? "#e7f1ff" : "white",
                    }}
                  >
                    <span>{name}</span>
                  </div>
                );
              })}
            </div>

            {/* Chat Area */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <div style={{ padding: 12, borderBottom: "1px solid #ddd" }}>
                <h3>Chat</h3>
              </div>
              <div style={{ flex: 1, padding: 12, overflowY: "auto", background: "#f9f9f9" }}>
                {messages.map((msg) => {
                  const isMe = msg.from?.id === "me" || msg.from?.name === selectedPage?.name;
                  const bubbleStyle = {
                    display: "inline-block",
                    padding: 10,
                    borderRadius: 8,
                    backgroundColor: isMe ? "#d1e7dd" : "#f0f0f0",
                    border: "1px solid #ccc",
                    maxWidth: "80%",
                  };

                  return (
                    <div key={msg.id} style={{ textAlign: isMe ? "right" : "left", marginBottom: 10 }}>
                      <div style={bubbleStyle}>
                        <strong>{msg.displayName}</strong>
                        <div>{msg.message}</div>
                        <small>{new Date(msg.created_time).toLocaleString()}</small>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", padding: 12, borderTop: "1px solid #ddd" }}>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message"
                  style={{ flex: 1, padding: 10, borderRadius: 5, border: "1px solid #ccc" }}
                />
                <button
                  onClick={sendMessage}
                  style={{
                    marginLeft: 10,
                    padding: "10px 20px",
                    backgroundColor: "#007bff",
                    color: "white",
                    border: "none",
                    borderRadius: 5,
                  }}
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SocialChatDashboard;
