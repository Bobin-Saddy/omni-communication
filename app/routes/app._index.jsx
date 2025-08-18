import { useState, useEffect, useRef } from "react";
import { useLoaderData } from "@remix-run/react";

export default function SocialChatDashboard() {
  const [fbPages, setFbPages] = useState([]);
  const [igPages, setIgPages] = useState([]);
  const [fbConnected, setFbConnected] = useState(false);
  const [igConnected, setIgConnected] = useState(false);
  const [waConnected, setWaConnected] = useState(false);
  const [cwConnected, setCwConnected] = useState(false); // Chat Widget
  const [selectedPage, setSelectedPage] = useState(null);
  const [pageAccessTokens, setPageAccessTokens] = useState({});
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState({});
  const [newMessage, setNewMessage] = useState("");

  const data = useLoaderData() || { sessions: [] };
  const [sessions, setSessions] = useState(data.sessions);

  const messagesEndRef = useRef(null);

  const FACEBOOK_APP_ID = "544704651303656";

  // ---------- Poll backend sessions ----------
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

  // ---------- Initialize Facebook SDK ----------
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

  // ---------- Auto scroll chat ----------
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // ---------- Facebook Login ----------
  const handleFacebookLogin = async () => {
    window.FB.login(
      async (response) => {
        if (response.authResponse) {
          setFbConnected(true);
          fetchFbPages(response.authResponse.accessToken);
        } else {
          alert("Facebook login failed.");
        }
      },
      { scope: "pages_show_list,pages_messaging" }
    );
  };

  const fetchFbPages = async (token) => {
    setFbPages([]);
    try {
      const res = await fetch(
        `https://graph.facebook.com/me/accounts?access_token=${token}`
      );
      const data = await res.json();
      if (data.data) {
        const pages = data.data.map((p) => ({
          id: p.id,
          name: p.name,
          type: "facebook",
        }));
        setFbPages(pages);

        const tokens = {};
        data.data.forEach((p) => {
          tokens[p.id] = p.access_token;
        });
        setPageAccessTokens(tokens);
      }
    } catch (err) {
      console.error("Fetch FB pages error", err);
    }
  };

  // ---------- Instagram Login ----------
  const handleInstagramLogin = async () => {
    // For demo purposes, assume token fetched from backend
    setIgConnected(true);
    setIgPages([{ id: "ig1", name: "Instagram Page 1", type: "instagram" }]);
  };

  // ---------- WhatsApp Connect ----------
  const handleWhatsAppConnect = async () => {
    // For demo purposes, assume connection success
    setWaConnected(true);
    setSelectedPage({ id: "whatsapp", name: "WhatsApp", type: "whatsapp" });

    // Fetch conversations
    try {
      const res = await fetch("/get-whatsapp-conversations");
      const data = await res.json();
      setConversations(data.conversations || []);
      setMessages({});
      setSelectedConversation(null);
    } catch (err) {
      console.error("WhatsApp fetch error", err);
    }
  };

  // ---------- Chat Widget Connect ----------
  const handleChatWidgetConnect = async () => {
    setCwConnected(true);
    setSelectedPage({ id: "chatwidget", name: "Chat Widget", type: "chatwidget" });

    try {
      const res = await fetch("/get-chatwidget-users");
      const users = await res.json(); // [{ id, name }]
      const convs = users.map((u, i) => ({
        id: `cw-${i}`,
        userName: u.name || `Widget User ${i + 1}`,
        businessName: "You",
        userId: u.id,
      }));
      setConversations(convs);
      setMessages({});
      setSelectedConversation(null);
    } catch (err) {
      alert("Failed to fetch Chat Widget users.");
      console.error(err);
    }
  };

  // ---------- Fetch Conversations ----------
  const fetchConversations = async (page) => {
    setSelectedPage(page);
    setLoadingConversations(true);

    try {
      if (page.type === "facebook") {
        const token = pageAccessTokens[page.id];
        const res = await fetch(
          `https://graph.facebook.com/${page.id}/conversations?access_token=${token}`
        );
        const data = await res.json();
        const convs = (data.data || []).map((c) => ({
          id: c.id,
          userName: c.participants?.data[0]?.name || "FB User",
          type: "facebook",
        }));
        setConversations(convs);
        setMessages({});
        setSelectedConversation(null);
      } else if (page.type === "instagram") {
        // Assume backend fetch
        const res = await fetch(`/get-ig-conversations?pageId=${page.id}`);
        const data = await res.json();
        setConversations(data.conversations || []);
        setMessages({});
        setSelectedConversation(null);
      } else if (page.type === "whatsapp") {
        handleWhatsAppConnect();
      } else if (page.type === "chatwidget") {
        handleChatWidgetConnect();
      }
    } catch (err) {
      console.error("Fetch conversations error", err);
    } finally {
      setLoadingConversations(false);
    }
  };

  // ---------- Fetch Messages ----------
  const fetchMessages = async (conv) => {
    setSelectedConversation(conv);

    if (!selectedPage) return;

    try {
      if (selectedPage.type === "facebook") {
        const token = pageAccessTokens[selectedPage.id];
        const res = await fetch(
          `https://graph.facebook.com/${conv.id}/messages?access_token=${token}`
        );
        const data = await res.json();
        const msgs = (data.data || []).map((m) => ({
          id: m.id,
          from: { id: m.from?.id },
          message: m.message,
          created_time: m.created_time,
          displayName: m.from?.name || "FB User",
        }));
        setMessages((prev) => ({ ...prev, [conv.id]: msgs }));
      } else if (selectedPage.type === "instagram") {
        const res = await fetch(`/get-ig-messages?conversationId=${conv.id}`);
        const data = await res.json();
        setMessages((prev) => ({ ...prev, [conv.id]: data.messages || [] }));
      } else if (selectedPage.type === "whatsapp") {
        const res = await fetch(`/get-whatsapp-messages?conversationId=${conv.id}`);
        const data = await res.json();
        setMessages((prev) => ({ ...prev, [conv.id]: data.messages || [] }));
      } else if (selectedPage.type === "chatwidget") {
        const res = await fetch(`/get-chatwidget-messages?userId=${conv.userId}`);
        const data = await res.json();
        const backendMessages = (data.messages || []).map((m, i) => ({
          id: m.id || `cw-local-${i}`,
          from: { id: m.sender },
          message: m.content,
          created_time: new Date(m.timestamp).toISOString(),
          displayName: m.sender === "me" ? "You" : conv.userName,
        }));
        setMessages((prev) => ({ ...prev, [conv.id]: backendMessages }));
      }
    } catch (err) {
      console.error("Fetch messages error", err);
    }
  };

  // ---------- Send Message ----------
  const [sendingMessage, setSendingMessage] = useState(false);
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedPage || !selectedConversation || sendingMessage) return;

    setSendingMessage(true);

    try {
      if (selectedPage.type === "chatwidget") {
        await fetch("/send-chatwidget-message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: selectedConversation.userId,
            message: newMessage,
          }),
        });

        const localMsg = {
          id: "cw-local-" + Date.now(),
          from: { id: "me" },
          message: newMessage,
          created_time: new Date().toISOString(),
          displayName: "You",
        };

        setMessages((prev) => ({
          ...prev,
          [selectedConversation.id]: [...(prev[selectedConversation.id] || []), localMsg],
        }));
        setNewMessage("");
      }
      // Implement FB / IG / WA send message similarly
    } catch (err) {
      console.error("Send message error", err);
      alert("Failed to send message.");
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <div className="social-chat-dashboard" style={{ fontFamily: "Arial", maxWidth: 1200, margin: "auto" }}>
      <h1 style={{ textAlign: "center", margin: "20px 0" }}>📱 Social Chat Dashboard</h1>

      <div className="card" style={{ padding: 20, boxShadow: "0 2px 6px rgba(0,0,0,0.15)", borderRadius: 8 }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <button onClick={handleFacebookLogin} disabled={fbConnected} className="btn-primary">
            {fbConnected ? "Facebook Connected" : "Connect Facebook"}
          </button>
          <button onClick={handleInstagramLogin} disabled={igConnected} className="btn-primary" style={{ marginTop: 10 }}>
            {igConnected ? "Instagram Connected" : "Connect Instagram"}
          </button>
          <button onClick={handleWhatsAppConnect} disabled={waConnected} className="btn-primary" style={{ marginTop: 10 }}>
            {waConnected ? "WhatsApp Connected" : "Connect WhatsApp"}
          </button>
          <button onClick={handleChatWidgetConnect} disabled={cwConnected} className="btn-primary" style={{ marginTop: 10 }}>
            {cwConnected ? "Chat Widget Connected" : "Connect Chat Widget"}
          </button>
        </div>

        {/* Pages + Conversations + Chat panel */}
        {selectedPage && (
          <div style={{ display: "flex", height: 650, border: "1px solid #ccc", borderRadius: 8, overflow: "hidden" }}>
            {/* Pages Sidebar */}
            <div style={{ width: "22%", borderRight: "1px solid #eee", overflowY: "auto" }}>
              <div style={{ padding: 12, borderBottom: "1px solid #ddd", background: "#f7f7f7", fontWeight: "600" }}>Pages</div>
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
                <div onClick={handleWhatsAppConnect} style={{ padding: 12, cursor: "pointer", backgroundColor: selectedPage?.type === "whatsapp" ? "#e3f2fd" : "white", borderBottom: "1px solid #eee" }}>
                  WhatsApp
                </div>
              )}
              {cwConnected && (
                <div onClick={handleChatWidgetConnect} style={{ padding: 12, cursor: "pointer", backgroundColor: selectedPage?.type === "chatwidget" ? "#e3f2fd" : "white", borderBottom: "1px solid #eee" }}>
                  Chat Widget
                </div>
              )}
            </div>

            {/* Conversations */}
            <div style={{ width: "28%", borderRight: "1px solid #eee", overflowY: "auto" }}>
              <div style={{ padding: 12, borderBottom: "1px solid #ddd", background: "#f7f7f7", fontWeight: "600" }}>Conversations</div>
              {conversations.length === 0 && <div style={{ padding: 12 }}>No conversations.</div>}
              {conversations.map((conv) => (
                <div key={conv.id} onClick={() => fetchMessages(conv)} style={{ padding: 12, cursor: "pointer", backgroundColor: selectedConversation?.id === conv.id ? "#e7f1ff" : "white", borderBottom: "1px solid #eee" }}>
                  {conv.userName}
                </div>
              ))}
            </div>

            {/* Chat */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <div style={{ padding: 12, borderBottom: "1px solid #ddd", background: "#f7f7f7", fontWeight: "600" }}>Chat</div>
              <div style={{ flex: 1, padding: 12, overflowY: "auto", background: "#f9f9f9" }}>
                {(messages[selectedConversation?.id] || []).map((msg) => {
                  const isMe = msg.from?.id === "me";
                  const bubbleStyle = {
                    alignSelf: isMe ? "flex-end" : "flex-start",
                    backgroundColor: isMe ? "#d1e7dd" : "#f0f0f0",
                    color: "#333",
                    padding: "10px 15px",
                    borderRadius: 15,
                    marginBottom: 8,
                    maxWidth: "70%",
                  };
                  return (
                    <div key={msg.id} style={{ display: "flex", flexDirection: "column" }}>
                      <div style={bubbleStyle}>
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
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); sendMessage(); } }}
                  disabled={sendingMessage}
                />
                <button
                  onClick={sendMessage}
                  disabled={sendingMessage || !newMessage.trim()}
                  style={{
                    marginLeft: 10,
                    padding: "10px 20px",
                    backgroundColor: sendingMessage ? "#6c757d" : "#007bff",
                    color: "white",
                    border: "none",
                    borderRadius: 5,
                  }}
                >
                  {sendingMessage ? "Sending..." : "Send"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .btn-primary {
          background-color: #000;
          color: white;
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.3s ease;
        }
        .btn-primary:disabled {
          background-color: #555;
          cursor: not-allowed;
        }
        .btn-primary:not(:disabled):hover {
          background-color: #222;
        }
      `}</style>
    </div>
  );
}
