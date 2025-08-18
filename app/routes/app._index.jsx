import { useState, useEffect, useRef } from "react";
import { useLoaderData, Link } from "react-router-dom";

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
  const [messages, setMessages] = useState({}); // ✅ always an object keyed by conv.id
  const [newMessage, setNewMessage] = useState("");

  const data = useLoaderData() || { sessions: [] }; // ✅ safe fallback
  const [sessions, setSessions] = useState(data.sessions);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const url = new URL(window.location.href);
        const shop = url.searchParams.get("shop");
        if (!shop) return;

        const res = await fetch(`/admin/chat/list?shop=${shop}`);
        const data = await res.json();
        setSessions(data.sessions || []);
      } catch (err) {
        console.error("Polling error", err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Loading states
  const [loadingPages, setLoadingPages] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  const messagesEndRef = useRef(null);

  const FACEBOOK_APP_ID = "544704651303656";
  const WHATSAPP_TOKEN = "YOUR_WHATSAPP_TOKEN"; // ⚠️ replace with env variable
  const WHATSAPP_PHONE_NUMBER_ID = "106660072463312";
  const WHATSAPP_RECIPIENT_NUMBER = "919779728764";

  // Initialize Facebook SDK
  useEffect(() => {
    window.fbAsyncInit = function () {
      window.FB.init({
        appId: FACEBOOK_APP_ID,
        cookie: true,
        xfbml: true,
        version: "v18.0",
      });
    };

    if (!document.getElementById("facebook-jssdk")) {
      const js = document.createElement("script");
      js.id = "facebook-jssdk";
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      document.body.appendChild(js);
    }
  }, []);

  // Scroll chat to bottom when messages update
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, selectedConversation]);

  const resetFbData = () => {
    setFbPages([]);
    setFbConnected(false);
    if (selectedPage?.type === "facebook") {
      setSelectedPage(null);
      setConversations([]);
      setMessages({});
    }
  };

  const resetIgData = () => {
    setIgPages([]);
    setIgConnected(false);
    if (selectedPage?.type === "instagram") {
      setSelectedPage(null);
      setConversations([]);
      setMessages({});
    }
  };

  const handleFacebookLogin = () => {
    window.FB.login(
      (res) => {
        if (res.authResponse) {
          resetIgData();
          fetchFacebookPages(res.authResponse.accessToken);
        }
      },
      {
        scope: "pages_show_list,pages_messaging,pages_read_engagement,pages_manage_posts",
      }
    );
  };

  const handleInstagramLogin = () => {
    window.FB.login(
      (res) => {
        if (res.authResponse) {
          resetFbData();
          fetchInstagramPages(res.authResponse.accessToken);
        }
      },
      {
        scope:
          "pages_show_list,instagram_basic,instagram_manage_messages,pages_read_engagement,pages_manage_metadata",
      }
    );
  };

  const handleWhatsAppConnect = async () => {
    setWaConnected(true);
    setSelectedPage({ id: "whatsapp", name: "WhatsApp", type: "whatsapp" });

    try {
      const res = await fetch("/get-whatsapp-users");
      const users = await res.json();

      const convs = users.map((u, index) => ({
        id: `wa-${index}`,
        userName: u.name || u.number,
        businessName: "You",
        userNumber: u.number,
      }));

      setConversations(convs);
      setMessages({});
      setSelectedConversation(null);
    } catch (error) {
      alert("Failed to fetch WhatsApp users.");
      console.error(error);
    }
  };

  /**
   * Other functions: fetchFacebookPages, fetchInstagramPages,
   * fetchConversations, fetchMessages, sendWhatsAppMessage,
   * sendMessage — remain same with `setMessages` always working as object
   */

  return (
    <div
      className="social-chat-dashboard"
      style={{ fontFamily: "Arial, sans-serif", maxWidth: 1200, margin: "auto" }}
    >
      <h1 style={{ textAlign: "center", margin: "20px 0" }}>📱 Social Chat Dashboard</h1>

      {/* 🔹 Connection Buttons */}
      <div className="card for-box" style={{ padding: 20, boxShadow: "0 2px 6px rgba(0,0,0,0.15)", borderRadius: 8 }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <button onClick={handleFacebookLogin} disabled={fbConnected || loadingPages} className="btn-primary">
            {loadingPages && !fbConnected ? "Loading..." : fbConnected ? "Facebook Connected" : "Connect Facebook"}
          </button>

          <div style={{ marginTop: 10 }}>
            <button onClick={handleInstagramLogin} disabled={igConnected || loadingPages} className="btn-primary">
              {loadingPages && !igConnected ? "Loading..." : igConnected ? "Instagram Connected" : "Connect Instagram"}
            </button>
          </div>

          <div style={{ marginTop: 10 }}>
            <button onClick={handleWhatsAppConnect} disabled={waConnected} className="btn-primary">
              {waConnected ? "WhatsApp Connected" : "Connect WhatsApp"}
            </button>
          </div>
        </div>

        {/* 🔹 Main Chat Layout */}
        {selectedPage && (
          <div style={{ display: "flex", height: 650, border: "1px solid #ccc", borderRadius: 8, overflow: "hidden" }}>

            {/* Sidebar - Pages */}
            <div style={{ width: "22%", borderRight: "1px solid #eee", overflowY: "auto" }}>
              <div style={{ padding: 12, borderBottom: "1px solid #ddd", background: "#f7f7f7", fontWeight: "600" }}>Pages</div>
              {[...fbPages, ...igPages].map((page) => (
                <div key={page.id} onClick={() => fetchConversations(page)}
                  style={{ padding: 12, cursor: "pointer", backgroundColor: selectedPage?.id === page.id ? "#e3f2fd" : "white", borderBottom: "1px solid #eee" }}>
                  {page.name} <small style={{ color: "#888" }}>({page.type})</small>
                </div>
              ))}
              {waConnected && (
                <div onClick={handleWhatsAppConnect} style={{ padding: 12, cursor: "pointer", backgroundColor: selectedPage?.type === "whatsapp" ? "#e3f2fd" : "white", borderBottom: "1px solid #eee" }}>
                  WhatsApp
                </div>
              )}
            </div>

            {/* Sidebar - Conversations */}
            <div style={{ width: "28%", borderRight: "1px solid #eee", overflowY: "auto" }}>
              <div style={{ padding: 12, borderBottom: "1px solid #ddd", background: "#f7f7f7", fontWeight: "600" }}>Conversations</div>

              <div>
                <h1>Chat Sessions for this Store</h1>
                {sessions.length === 0 ? (
                  <p>No active sessions</p>
                ) : (
                  <ul>
                    {sessions.map((s) => (
                      <li key={s.id}>
                        <Link to={`/admin/chat/${s.sessionId}`}>
                          👤 {s.sessionId} <br /> 🏬 {s.storeDomain}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {loadingConversations && <div style={{ padding: 12 }}>Loading conversations...</div>}
              {!loadingConversations && conversations.length === 0 && <div style={{ padding: 12 }}>No conversations available.</div>}

              {conversations.map((conv) => {
                const name = selectedPage?.type === "instagram"
                  ? `${conv.businessName} ↔️ ${conv.userName}`
                  : selectedPage?.type === "whatsapp"
                    ? conv.userName || conv.profile?.name || conv.contacts?.[0]?.profile?.name || conv.contacts?.[0]?.wa_id || conv.wa_id || "WhatsApp User"
                    : conv.participants?.data?.filter((p) => p.name !== selectedPage.name).map((p) => p.name).join(", ") || "User";

                return (
                  <div key={conv.id} onClick={() => fetchMessages(conv)}
                    style={{ padding: 12, cursor: "pointer", backgroundColor: selectedConversation?.id === conv.id ? "#e7f1ff" : "white", borderBottom: "1px solid #eee" }}>
                    {name}
                  </div>
                );
              })}
            </div>

            {/* Chat Window */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <div style={{ padding: 12, borderBottom: "1px solid #ddd", background: "#f7f7f7", fontWeight: "600" }}>Chat</div>

              {/* Messages */}
              <div style={{ flex: 1, padding: 12, overflowY: "auto", background: "#f9f9f9", display: "flex", flexDirection: "column" }}>
                {(messages[selectedConversation?.id] || []).map((msg) => {
                  const businessNumber = WHATSAPP_RECIPIENT_NUMBER;
                  const fromId = msg.from?.id || msg.from;
                  const isMe = fromId === businessNumber || fromId === "me" || fromId === selectedPage?.id;

                  return (
                    <div key={msg.id} style={{ display: "flex", flexDirection: "column" }}>
                      <div style={{ alignSelf: isMe ? "flex-end" : "flex-start", backgroundColor: isMe ? "#d1e7dd" : "#f0f0f0", color: "#333", padding: "10px 15px", borderRadius: 15, marginBottom: 8, maxWidth: "70%", wordBreak: "break-word", boxShadow: "0 1px 2px rgba(0,0,0,0.1)" }}>
                        <strong>{isMe ? "You" : msg.displayName || "User"}</strong>
                        <div>{msg.message}</div>
                        <small style={{ fontSize: 10, color: "#666" }}>{new Date(msg.created_time).toLocaleString()}</small>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div style={{ display: "flex", padding: 12, borderTop: "1px solid #ddd" }}>
                <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message"
                  style={{ flex: 1, padding: 10, borderRadius: 5, border: "1px solid #ccc" }}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); sendMessage(); } }}
                  disabled={sendingMessage}
                />

                <button onClick={() => { if (!sendingMessage && newMessage.trim()) sendMessage(); }}
                  disabled={sendingMessage || !newMessage.trim()}
                  style={{ marginLeft: 10, padding: "10px 20px", backgroundColor: sendingMessage ? "#6c757d" : "#007bff", color: "white", border: "none", borderRadius: 5, cursor: sendingMessage ? "not-allowed" : "pointer" }}>
                  {sendingMessage ? "Sending..." : "Send"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 🔹 Button Styles */}
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
