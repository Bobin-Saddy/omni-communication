import { useState, useEffect, useRef } from "react";

export default function SocialChatDashboard() {
  const [fbPages, setFbPages] = useState([]);
  const [igPages, setIgPages] = useState([]);
  const [fbConnected, setFbConnected] = useState(false);
  const [igConnected, setIgConnected] = useState(false);
  const [waConnected, setWaConnected] = useState(false);
  const [loadingPages, setLoadingPages] = useState(false);

  const [selectedPage, setSelectedPage] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState({});
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  // Shopify
  const [shopifySessions, setShopifySessions] = useState([]);
  const [loadingShopify, setLoadingShopify] = useState(false);
  const [showShopifyWidget, setShowShopifyWidget] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedConversation]);

  // === Dummy Handlers for FB, IG, WA ===
  const handleFacebookLogin = async () => { setFbConnected(true); /* Fetch pages */ };
  const handleInstagramLogin = async () => { setIgConnected(true); /* Fetch pages */ };
  const handleWhatsAppConnect = async () => { setWaConnected(true); /* Fetch WA sessions */ };

  const fetchConversations = (page) => {
    setSelectedPage(page);
    setConversations([
      // Replace with actual API response
      { id: "1", participants: { data: [{ name: "User 1" }] } },
      { id: "2", participants: { data: [{ name: "User 2" }] } },
    ]);
    setSelectedConversation(null);
  };

  const fetchMessages = (conv) => {
    setSelectedConversation(conv);
    setMessages((prev) => ({
      ...prev,
      [conv.id]: [
        { id: "m1", message: "Hello", created_time: Date.now(), from: "me" },
        { id: "m2", message: "Hi there", created_time: Date.now(), from: "user" },
      ],
    }));
  };

  // === Shopify handlers ===
  const openShopifyConversation = (session) => {
    setSelectedPage({ ...session, type: "shopify" });
    setSelectedConversation(session);

    setMessages((prev) => ({
      ...prev,
      [session.sessionId]: [
        { id: "s1", message: "Hello from Shopify user", created_time: Date.now(), displayName: session.sessionId },
      ],
    }));
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;
    setSendingMessage(true);

    // Dummy sending
    const convId = selectedConversation.id || selectedConversation.sessionId;
    setMessages((prev) => ({
      ...prev,
      [convId]: [
        ...(prev[convId] || []),
        { id: Date.now().toString(), message: newMessage, created_time: Date.now(), from: "me" },
      ],
    }));
    setNewMessage("");
    setSendingMessage(false);
  };

  const sendShopifyMessage = async () => {
    await sendMessage(); // For demo, same as normal send
  };

  return (
    <div
      className="social-chat-dashboard"
      style={{ fontFamily: "Arial, sans-serif", maxWidth: 1200, margin: "auto" }}
    >
      <h1 style={{ textAlign: "center", margin: "20px 0" }}>📱 Social Chat Dashboard</h1>

      <div
        className="card for-box"
        style={{ padding: 20, boxShadow: "0 2px 6px rgba(0,0,0,0.15)", borderRadius: 8 }}
      >
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <button onClick={handleFacebookLogin} disabled={fbConnected || loadingPages} className="btn-primary">
            {loadingPages && !fbConnected
              ? "Loading..."
              : fbConnected
              ? "Facebook Connected"
              : "Connect Facebook"}
          </button>

          <div style={{ marginTop: 10 }}>
            <button onClick={handleInstagramLogin} disabled={igConnected || loadingPages} className="btn-primary">
              {loadingPages && !igConnected
                ? "Loading..."
                : igConnected
                ? "Instagram Connected"
                : "Connect Instagram"}
            </button>
          </div>

          <div style={{ marginTop: 10 }}>
            <button onClick={handleWhatsAppConnect} disabled={waConnected} className="btn-primary">
              {waConnected ? "WhatsApp Connected" : "Connect WhatsApp"}
            </button>
          </div>

          <div style={{ marginTop: 10 }}>
            <button
              onClick={() => setShowShopifyWidget((prev) => !prev)}
              className="btn-primary"
            >
              {showShopifyWidget ? "Hide Shopify Widget" : "Show Shopify Widget"}
            </button>
          </div>
        </div>

        <div style={{ display: "flex", height: 650, border: "1px solid #ccc", borderRadius: 8, overflow: "hidden" }}>
          {/* Pages Sidebar */}
          <div style={{ width: "22%", borderRight: "1px solid #eee", overflowY: "auto" }}>
            <div style={{ padding: 12, borderBottom: "1px solid #ddd", background: "#f7f7f7", fontWeight: "600" }}>
              Pages
            </div>

            {[...fbPages, ...igPages].map((page) => (
              <div
                key={page.id}
                onClick={() => fetchConversations(page)}
                style={{
                  padding: 12,
                  cursor: "pointer",
                  backgroundColor: selectedPage?.id === page.id ? "#e3f2fd" : "white",
                  borderBottom: "1px solid #eee",
                }}
              >
                {page.name} <small style={{ color: "#888" }}>({page.type})</small>
              </div>
            ))}

            {waConnected && (
              <div
                onClick={handleWhatsAppConnect}
                style={{
                  padding: 12,
                  cursor: "pointer",
                  backgroundColor: selectedPage?.type === "whatsapp" ? "#e3f2fd" : "white",
                  borderBottom: "1px solid #eee",
                }}
              >
                WhatsApp
              </div>
            )}

            {/* Shopify Pages */}
            {shopifySessions.length > 0 && (
              <>
                <div
                  style={{
                    padding: 12,
                    borderBottom: "1px solid #ddd",
                    background: "#f7f7f7",
                    fontWeight: "600",
                    marginTop: 10,
                  }}
                >
                  Shopify
                </div>
                {shopifySessions.map((s) => (
                  <div
                    key={s.sessionId}
                    onClick={() => openShopifyConversation(s)}
                    style={{
                      padding: 12,
                      cursor: "pointer",
                      backgroundColor: selectedPage?.id === s.sessionId ? "#e3f2fd" : "white",
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    👤 {s.sessionId} <br /> 🏬 {s.storeDomain}
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Conversations List */}
          <div style={{ width: "28%", borderRight: "1px solid #eee", overflowY: "auto" }}>
            <div style={{ padding: 12, borderBottom: "1px solid #ddd", background: "#f7f7f7", fontWeight: "600" }}>
              Conversations
            </div>

            {loadingPages && <div style={{ padding: 12 }}>Loading...</div>}

            {(conversations.length === 0) && <div style={{ padding: 12 }}>No conversations available.</div>}

            {conversations.map((conv) => {
              let name;
              if (selectedPage?.type === "shopify") {
                name = conv.userName || conv.sessionId || "Shopify User";
              } else if (selectedPage?.type === "instagram") {
                name = `${conv.businessName} ↔️ ${conv.userName}`;
              } else if (selectedPage?.type === "whatsapp") {
                name =
                  conv.userName ||
                  conv.profile?.name ||
                  conv.contacts?.[0]?.profile?.name ||
                  conv.contacts?.[0]?.wa_id ||
                  conv.wa_id ||
                  "WhatsApp User";
              } else {
                name =
                  conv.participants?.data
                    ?.filter((p) => p.name !== selectedPage.name)
                    .map((p) => p.name)
                    .join(", ") || "User";
              }

              return (
                <div
                  key={conv.id || conv.sessionId}
                  onClick={() => {
                    selectedPage?.type === "shopify"
                      ? openShopifyConversation(conv)
                      : fetchMessages(conv);
                  }}
                  style={{
                    padding: 12,
                    cursor: "pointer",
                    backgroundColor: selectedConversation?.id === conv.id ? "#e7f1ff" : "white",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  {name}
                </div>
              );
            })}
          </div>

          {/* Chat Area */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div style={{ padding: 12, borderBottom: "1px solid #ddd", background: "#f7f7f7", fontWeight: "600" }}>
              Chat
            </div>

            <div style={{ flex: 1, padding: 12, overflowY: "auto", background: "#f9f9f9", display: "flex", flexDirection: "column" }}>
              {(messages[selectedConversation?.id || selectedConversation?.sessionId] || []).map((msg) => {
                const isMe =
                  selectedPage?.type === "shopify"
                    ? msg.displayName === "You"
                    : msg.from === "me";

                return (
                  <div key={msg.id} style={{ display: "flex", flexDirection: "column", marginBottom: 8 }}>
                    <div
                      style={{
                        alignSelf: isMe ? "flex-end" : "flex-start",
                        backgroundColor: isMe ? "#d1e7dd" : "#f0f0f0",
                        color: "#333",
                        padding: "10px 15px",
                        borderRadius: 15,
                        maxWidth: "70%",
                        wordBreak: "break-word",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                      }}
                    >
                      <strong>{isMe ? "You" : msg.displayName || "User"}</strong>
                      <div>{msg.message}</div>
                      <small style={{ fontSize: 10, color: "#666" }}>
                        {new Date(msg.created_time).toLocaleString()}
                      </small>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div style={{ display: "flex", padding: 12, borderTop: "1px solid #ddd" }}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message"
                style={{ flex: 1, padding: 10, borderRadius: 5, border: "1px solid #ccc" }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    selectedPage?.type === "shopify" ? sendShopifyMessage() : sendMessage();
                  }
                }}
              />
              <button
                onClick={() => (selectedPage?.type === "shopify" ? sendShopifyMessage() : sendMessage())}
                style={{
                  marginLeft: 10,
                  padding: "10px 20px",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: 5,
                  cursor: "pointer",
                }}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .btn-primary {
          background-color: #000000;
          color: white;
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }
        .btn-primary:disabled {
          background-color: #555555;
          cursor: not-allowed;
        }
        .btn-primary:not(:disabled):hover {
          background-color: #222222;
        }
      `}</style>
    </div>
  );
}
