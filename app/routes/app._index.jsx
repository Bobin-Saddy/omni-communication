import { useState, useEffect, useRef } from "react";

export default function SocialChatDashboard() {
  const [fbPages, setFbPages] = useState([]);
  const [igPages, setIgPages] = useState([]);
  const [fbConnected, setFbConnected] = useState(false);
  const [igConnected, setIgConnected] = useState(false);
  const [waConnected, setWaConnected] = useState(false);
  const [selectedPage, setSelectedPage] = useState(null);
  const [pageAccessTokens, setPageAccessTokens] = useState({});
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  // Shopify chat
  const [shopifySessions, setShopifySessions] = useState([]);
  const [showShopifyWidget, setShowShopifyWidget] = useState(false);
  const [loadingShopify, setLoadingShopify] = useState(false);

  const messagesEndRef = useRef(null);

  const FACEBOOK_APP_ID = "544704651303656";
  const WHATSAPP_TOKEN =
    "EAAHvZAZB8ZCmugBPIjGgJPhMPTQxKsi4MQ5EfMvZBqwWpbbzbI6LZAT1NrNz8iU26wiSmjtZBVE2qHYGKWXfefExUXep35hNuofn7RhZC4TrT7gANcttxtTxAuujZBgaCQz3CSXZAv1vIEuaHvatdfpGihQRVKSVYJA95zkEMh0zEaRg9OC2YjyJHZBRDSpVjPXIYml4BElZB95BZBeq4CHwy8f3dTnosove2FRF1I1iNMf8WwZDZD";
  const WHATSAPP_PHONE_NUMBER_ID = "106660072463312";
  const WHATSAPP_RECIPIENT_NUMBER = "919779728764";

  /** Scroll chat to bottom */
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, selectedConversation]);

  /** Poll Shopify chat sessions */
  useEffect(() => {
    const interval = setInterval(fetchShopifySessions, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchShopifySessions = async () => {
    setLoadingShopify(true);
    try {
      const url = new URL(window.location.href);
      const shop = url.searchParams.get("shop");
      if (!shop) return;

      const res = await fetch(`/admin/chat/list?shop=${shop}`);
      const data = await res.json();
      setShopifySessions(data.sessions || []);
    } catch (err) {
      console.error("Error fetching Shopify sessions:", err);
    } finally {
      setLoadingShopify(false);
    }
  };

  /** Open Shopify conversation */
  const openShopifyConversation = async (session) => {
    setSelectedPage({ id: session.sessionId, name: session.storeDomain, type: "shopify" });
    setSelectedConversation(session);

    try {
      const res = await fetch(`/admin/chat/messages?sessionId=${session.sessionId}`);
      const data = await res.json();
      setMessages({ [session.sessionId]: data.messages || [] });
    } catch (err) {
      console.error("Error fetching session messages:", err);
    }
  };

  /** Send Shopify message */
  const sendShopifyMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;
    try {
      const sessionId = selectedConversation.sessionId;
      await fetch("/admin/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: newMessage }),
      });

      const localMsg = {
        id: "local-" + Date.now(),
        displayName: "You",
        message: newMessage,
        created_time: new Date().toISOString(),
      };

      setMessages((prev) => ({
        ...prev,
        [sessionId]: [...(prev[sessionId] || []), localMsg],
      }));

      setNewMessage("");
    } catch (err) {
      console.error("Failed to send Shopify message", err);
    }
  };

  /** Facebook / Instagram / WhatsApp functions here (as in your old working code) */
  // handleFacebookLogin, handleInstagramLogin, handleWhatsAppConnect,
  // fetchFacebookPages, fetchInstagramPages, fetchConversations,
  // fetchMessages, sendMessage, sendWhatsAppMessage etc.

  return (
    <div style={{ fontFamily: "Arial, sans-serif", maxWidth: 1200, margin: "auto" }}>
      <h1 style={{ textAlign: "center", margin: "20px 0" }}>📱 Social Chat Dashboard</h1>

      <div style={{ padding: 20, boxShadow: "0 2px 6px rgba(0,0,0,0.15)", borderRadius: 8 }}>
        {/* Connect Buttons */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <button onClick={() => {}} className="btn-primary">Connect Facebook</button>
          <button onClick={() => {}} className="btn-primary" style={{ marginLeft: 10 }}>Connect Instagram</button>
          <button
            onClick={() => setShowShopifyWidget((prev) => !prev)}
            className="btn-primary"
            style={{ marginLeft: 10 }}
          >
            {showShopifyWidget ? "Hide Shopify Widget" : "Show Shopify Widget"}
          </button>
        </div>

        {/* Main Layout */}
        <div style={{ display: "flex", height: 650, border: "1px solid #ccc", borderRadius: 8, overflow: "hidden" }}>
          
          {/* Pages Sidebar (FB/IG/WA) */}
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
                onClick={() => {}}
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
          </div>

          {/* Conversations List (FB/IG/WA) */}
          <div style={{ width: "28%", borderRight: "1px solid #eee", overflowY: "auto" }}>
            <div style={{ padding: 12, borderBottom: "1px solid #ddd", background: "#f7f7f7", fontWeight: "600" }}>
              Conversations
            </div>
            {conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => fetchMessages(conv)}
                style={{
                  padding: 12,
                  cursor: "pointer",
                  backgroundColor: selectedConversation?.id === conv.id ? "#e7f1ff" : "white",
                  borderBottom: "1px solid #eee",
                }}
              >
                {conv.userName || "User"}
              </div>
            ))}
          </div>

          {/* Chat Area */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div style={{ padding: 12, borderBottom: "1px solid #ddd", background: "#f7f7f7", fontWeight: "600" }}>
              Chat
            </div>

            <div style={{ flex: 1, padding: 12, overflowY: "auto", background: "#f9f9f9", display: "flex", flexDirection: "column" }}>
              {(messages[selectedConversation?.id] || []).map((msg) => {
                const isMe = msg.displayName === "You";
                return (
                  <div key={msg.id} style={{ marginBottom: 8, alignSelf: isMe ? "flex-end" : "flex-start" }}>
                    <div style={{
                      backgroundColor: isMe ? "#d1e7dd" : "#f0f0f0",
                      padding: 10,
                      borderRadius: 12,
                      maxWidth: "70%",
                    }}>
                      <strong>{msg.displayName}</strong>: {msg.message}
                      <div style={{ fontSize: 10, color: "#666" }}>
                        {new Date(msg.created_time).toLocaleString()}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{ display: "flex", padding: 12, borderTop: "1px solid #ddd" }}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message"
                style={{ flex: 1, padding: 10, borderRadius: 5, border: "1px solid #ccc" }}
                onKeyDown={(e) => e.key === "Enter" && (selectedPage?.type === "shopify" ? sendShopifyMessage() : sendMessage())}
              />
              <button
                onClick={() => selectedPage?.type === "shopify" ? sendShopifyMessage() : sendMessage()}
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

        {/* Shopify Widget below main layout */}
        {showShopifyWidget && (
          <div style={{ marginTop: 20, border: "1px solid #ccc", borderRadius: 8, padding: 12, maxHeight: 400, overflowY: "auto" }}>
            <h3>Active Shopify Conversations</h3>
            {loadingShopify && <p>Loading...</p>}
            {!loadingShopify && shopifySessions.length === 0 && <p>No active sessions</p>}
            <ul>
              {shopifySessions.map((s) => (
                <li
                  key={s.sessionId}
                  onClick={() => openShopifyConversation(s)}
                  style={{
                    cursor: "pointer",
                    padding: 8,
                    background: selectedConversation?.sessionId === s.sessionId ? "#e3f2fd" : "white",
                    marginBottom: 4,
                    borderRadius: 4,
                  }}
                >
                  👤 {s.sessionId} <br /> 🏬 {s.storeDomain}
                </li>
              ))}
            </ul>
          </div>
        )}
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
