import { useState, useEffect, useRef } from "react";
import { useLoaderData, Link } from "@remix-run/react";

export default function SocialChatDashboard() {
  const [fbPages, setFbPages] = useState([]);
  const [igPages, setIgPages] = useState([]);
  const [fbConnected, setFbConnected] = useState(false);
  const [igConnected, setIgConnected] = useState(false);
  const [waConnected, setWaConnected] = useState(false);
  const [cwConnected, setCwConnected] = useState(false); // ✅ Chat Widget connection state
  const [selectedPage, setSelectedPage] = useState(null);
  const [pageAccessTokens, setPageAccessTokens] = useState({});
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState({}); // ✅ fix: store by conversation.id
  const [newMessage, setNewMessage] = useState("");

  const data = useLoaderData() || { sessions: [] };
  const [sessions, setSessions] = useState(data.sessions);

  // Poll backend sessions
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
  const WHATSAPP_TOKEN = "YOUR_WHATSAPP_TOKEN";
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

  // Auto scroll chat
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // ✅ ChatWidget Connect
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

  // Fetch messages
  const fetchMessages = async (conv) => {
    if (!selectedPage) return;
    setSelectedConversation(conv);

    // ✅ ChatWidget
    if (selectedPage.type === "chatwidget") {
      try {
        const res = await fetch(`/get-chatwidget-messages?userId=${conv.userId}`);
        const data = await res.json();
        const backendMessages = (data.messages || []).map((m, i) => ({
          id: m.id || `cw-local-${i}`,
          from: { id: m.sender },
          message: m.content,
          created_time: m.timestamp ? new Date(m.timestamp).toISOString() : new Date().toISOString(),
          displayName: m.sender === "me" ? "You" : conv.userName,
        }));
        setMessages((prev) => ({ ...prev, [conv.id]: backendMessages }));
      } catch (err) {
        console.error("ChatWidget messages fetch error", err);
      }
      return;
    }
 if (selectedPage.type === "whatsapp") {
    if (!conv.userNumber) {
      console.error("WhatsApp conversation missing userNumber");
      return;
    }
    try {
      const res = await fetch(`/get-messages?number=${conv.userNumber}`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();

const backendMessages = (data.messages || []).map((msg, index) => ({
  id: msg.id || `local-${index}`, // fallback id
  from: { id: msg.sender || "unknown" },
  message: msg.content || "",
  created_time: msg.timestamp
    ? new Date(msg.timestamp).toISOString()
    : msg.createdAt
    ? new Date(msg.createdAt).toISOString()
    : new Date().toISOString(),
}));


      setMessages((prevMessages) => {
        const prevConvMessages = prevMessages[conv.id] || [];

        // Filter local messages that backend hasn't returned yet
const localMessagesNotInBackend = prevConvMessages.filter(localMsg =>
  (localMsg.id && typeof localMsg.id === "string" && localMsg.id.startsWith("local-")) &&
  !backendMessages.some(bm =>
    bm.message?.trim() === localMsg.message?.trim() &&
    Math.abs(new Date(bm.created_time) - new Date(localMsg.created_time)) < 5000
  )
);


        // Combine backend + local pending messages for this conversation only
        return {
          ...prevMessages,
          [conv.id]: [...backendMessages, ...localMessagesNotInBackend],
        };
      });
    } catch (err) {
      console.error("Error fetching WhatsApp messages", err);
      alert("Failed to fetch WhatsApp messages.");
    }
    return;
  }

  // Facebook & Instagram messages
  try {
    const token = pageAccessTokens[selectedPage.id];
    const res = await fetch(
      `https://graph.facebook.com/v18.0/${conv.id}/messages?fields=from,message,created_time&access_token=${token}`
    );
    const data = await res.json();
    const rawMessages = data?.data?.reverse() || [];

    const enrichedMessages = rawMessages.map((msg) => {
      let displayName = "User";

      if (selectedPage.type === "instagram") {
        if (msg.from?.id === selectedPage.igId) {
          displayName = selectedPage.name;
        } else {
          displayName =
            conv.userName ||
            msg.from?.name ||
            msg.from?.username ||
            `Instagram User #${msg.from?.id?.slice(-4)}`;
        }
      } else {
        if (msg.from?.name === selectedPage.name) {
          displayName = selectedPage.name;
        } else {
          displayName = msg.from?.name || "User";
        }
      }

      return {
        ...msg,
        displayName,
      };
    });

    setMessages((prevMessages) => ({
      ...prevMessages,
      [conv.id]: enrichedMessages,
    }));
  } catch (error) {
    alert("Error fetching messages.");
    console.error(error);
  }
    // ... WhatsApp / Facebook / Instagram fetch logic (same as your code above)
  };

  // Send Message
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedPage || !selectedConversation || sendingMessage) return;

    // ✅ ChatWidget send
    if (selectedPage.type === "chatwidget") {
      setSendingMessage(true);
      try {
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
      } catch (err) {
        alert("Failed to send ChatWidget message.");
        console.error(err);
      } finally {
        setSendingMessage(false);
      }
      return;
    }
   if (selectedPage.type === "whatsapp") {
      await sendWhatsAppMessage();
      return;
    }

    setSendingMessage(true);
    try {
      const token = pageAccessTokens[selectedPage.id];

      if (selectedPage.type === "instagram") {
        const msgRes = await fetch(
          `https://graph.facebook.com/v18.0/${selectedConversation.id}/messages?fields=from&access_token=${token}`
        );
        const msgData = await msgRes.json();
        const sender = msgData?.data?.find((m) => m.from?.id !== selectedPage.igId);
        if (!sender) return alert("Recipient not found");

        await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${token}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messaging_product: "instagram",
            recipient: { id: sender.from.id },
            message: { text: newMessage },
          }),
        });
      } else {
        const participants = selectedConversation.participants?.data || [];
        const recipient = participants.find((p) => p.name !== selectedPage.name);
        if (!recipient) return alert("Recipient not found");

        await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${token}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipient: { id: recipient.id },
            message: { text: newMessage },
            messaging_type: "MESSAGE_TAG",
            tag: "ACCOUNT_UPDATE",
          }),
        });
      }

      setNewMessage("");
      await fetchMessages(selectedConversation);
    } catch (error) {
      alert("Failed to send message.");
      console.error(error);
    } finally {
      setSendingMessage(false);
    }
    // ... WhatsApp / FB / IG send logic (same as your code above)
  };

  return (
    <div className="social-chat-dashboard" style={{ fontFamily: "Arial", maxWidth: 1200, margin: "auto" }}>
      <h1 style={{ textAlign: "center", margin: "20px 0" }}>📱 Social Chat Dashboard</h1>

      <div className="card" style={{ padding: 20, boxShadow: "0 2px 6px rgba(0,0,0,0.15)", borderRadius: 8 }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <button onClick={handleFacebookLogin} disabled={fbConnected || loadingPages} className="btn-primary">
            {fbConnected ? "Facebook Connected" : "Connect Facebook"}
          </button>
          <div style={{ marginTop: 10 }}>
            <button onClick={handleInstagramLogin} disabled={igConnected || loadingPages} className="btn-primary">
              {igConnected ? "Instagram Connected" : "Connect Instagram"}
            </button>
          </div>
          <div style={{ marginTop: 10 }}>
            <button onClick={handleWhatsAppConnect} disabled={waConnected} className="btn-primary">
              {waConnected ? "WhatsApp Connected" : "Connect WhatsApp"}
            </button>
          </div>
          <div style={{ marginTop: 10 }}>
            <button onClick={handleChatWidgetConnect} disabled={cwConnected} className="btn-primary">
              {cwConnected ? "Chat Widget Connected" : "Connect Chat Widget"}
            </button>
          </div>
        </div>

        {/* Panels: Pages + Conversations + Chat */}
        {selectedPage && (
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
              {cwConnected && (
                <div
                  onClick={handleChatWidgetConnect}
                  style={{
                    padding: 12,
                    cursor: "pointer",
                    backgroundColor: selectedPage?.type === "chatwidget" ? "#e3f2fd" : "white",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  Chat Widget
                </div>
              )}
            </div>

            {/* Conversations */}
            <div style={{ width: "28%", borderRight: "1px solid #eee", overflowY: "auto" }}>
              <div style={{ padding: 12, borderBottom: "1px solid #ddd", background: "#f7f7f7", fontWeight: "600" }}>
                Conversations
              </div>
              {loadingConversations && <div style={{ padding: 12 }}>Loading conversations...</div>}
              {!loadingConversations && conversations.length === 0 && <div style={{ padding: 12 }}>No conversations.</div>}
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
                  {conv.userName}
                </div>
              ))}
            </div>

            {/* Chat */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <div style={{ padding: 12, borderBottom: "1px solid #ddd", background: "#f7f7f7", fontWeight: "600" }}>
                Chat
              </div>
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
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
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
