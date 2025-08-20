import { useState, useEffect, useRef } from "react";

export default function SocialChatDashboard() {
  // --- State ---
  const [fbPages, setFbPages] = useState([]);
  const [igPages, setIgPages] = useState([]);
  const [fbConnected, setFbConnected] = useState(false);
  const [igConnected, setIgConnected] = useState(false);
  const [waConnected, setWaConnected] = useState(false);
  const [widgetConnected, setWidgetConnected] = useState(false);

  const [selectedPage, setSelectedPage] = useState(null);
  const [pageAccessTokens, setPageAccessTokens] = useState({});
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState({});
  const [newMessage, setNewMessage] = useState("");

  const [currentStoreDomain, setCurrentStoreDomain] = useState(null);

  // Loading states
  const [loadingPages, setLoadingPages] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  const messagesEndRef = useRef(null);

  // --- Constants ---
  const FACEBOOK_APP_ID = "544704651303656";
  const WHATSAPP_TOKEN = "YOUR_WA_TOKEN";
  const WHATSAPP_PHONE_NUMBER_ID = "106660072463312";

  // --- Initialize shop domain ---
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const shop = urlParams.get("shop");
    if (shop) setCurrentStoreDomain(shop);
  }, []);

  // --- Initialize Facebook SDK ---
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

  // --- Auto scroll to bottom ---
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, selectedConversation]);

  // --- Reset helpers ---
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

  // --- Facebook / Instagram login ---
  const handleFacebookLogin = () => {
    window.FB.login(
      (res) => {
        if (res.authResponse) {
          resetIgData();
          fetchFacebookPages(res.authResponse.accessToken);
        }
      },
      {
        scope:
          "pages_show_list,pages_messaging,pages_read_engagement,pages_manage_posts",
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

  // --- Widget connect ---
  const handleWidgetConnect = async () => {
    try {
      setSelectedPage({ id: "widget", type: "widget", name: "Chat Widget" });
      setLoadingConversations(true);

      const res = await fetch(`/api/chat?widget=true`);
      if (!res.ok) throw new Error("Failed to fetch widget sessions");

      const data = await res.json();
      setConversations(data.sessions || []);

      setWidgetConnected(true);
    } catch (err) {
      console.error("Widget connect failed:", err);
    } finally {
      setLoadingConversations(false);
    }
  };

  // --- WhatsApp connect ---
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

  // --- Fetch Facebook pages ---
  const fetchFacebookPages = async (accessToken) => {
    setLoadingPages(true);
    try {
      const res = await fetch(
        `https://graph.facebook.com/me/accounts?fields=access_token,name,id&access_token=${accessToken}`
      );
      const data = await res.json();

      if (!Array.isArray(data?.data) || data.data.length === 0) {
        alert("No Facebook pages found.");
        return;
      }

      const tokens = {};
      const pages = data.data.map((page) => {
        tokens[page.id] = page.access_token;
        return { ...page, type: "facebook" };
      });

      setPageAccessTokens((prev) => ({ ...prev, ...tokens }));
      setFbPages(pages);
      setFbConnected(true);
      setSelectedPage(pages[0]);
      await fetchConversations(pages[0]);
    } catch (error) {
      alert("Error fetching Facebook pages.");
      console.error(error);
    } finally {
      setLoadingPages(false);
    }
  };

  // --- Fetch Instagram pages ---
  const fetchInstagramPages = async (accessToken) => {
    setLoadingPages(true);
    try {
      const res = await fetch(
        `https://graph.facebook.com/me/accounts?fields=access_token,name,id,instagram_business_account&access_token=${accessToken}`
      );
      const data = await res.json();

      const igPages = (data.data || []).filter((p) => p.instagram_business_account);
      if (igPages.length === 0) {
        alert("No Instagram business accounts found.");
        return;
      }

      const tokens = {};
      const enriched = igPages.map((page) => {
        tokens[page.id] = page.access_token;
        return {
          ...page,
          type: "instagram",
          igId: page.instagram_business_account.id,
        };
      });

      setPageAccessTokens((prev) => ({ ...prev, ...tokens }));
      setIgPages(enriched);
      setIgConnected(true);
      setSelectedPage(enriched[0]);
      setConversations([]);
    } catch (error) {
      alert("Error fetching Instagram pages.");
      console.error(error);
    } finally {
      setLoadingPages(false);
    }
  };

  // --- Fetch conversations (FB/IG/Widget/WA) ---
  const fetchConversations = async (page) => {
    setLoadingConversations(true);
    try {
      const token = pageAccessTokens[page.id];
      setSelectedPage(page);
      setSelectedConversation(null);
      setMessages({});

      if (page.type === "facebook" || page.type === "instagram") {
        const url =
          page.type === "instagram"
            ? `https://graph.facebook.com/v18.0/${page.id}/conversations?platform=instagram&fields=participants&access_token=${token}`
            : `https://graph.facebook.com/v18.0/${page.id}/conversations?fields=participants&access_token=${token}`;

        const res = await fetch(url);
        const data = await res.json();
        setConversations(data.data || []);
      }
    } catch (error) {
      alert("Error fetching conversations.");
      console.error(error);
    } finally {
      setLoadingConversations(false);
    }
  };

  // --- Fetch messages ---
  const fetchMessages = async (conv) => {
    if (!selectedPage) return;

    const messageKey = selectedPage.type === "widget" ? conv.sessionId : conv.id;
    setSelectedConversation({ ...conv, messageKey });

    try {
      let backendMessages = [];

      // Widget
      if (selectedPage.type === "widget") {
        const res = await fetch(
          `/api/chat?session_id=${conv.sessionId}&store_domain=${conv.storeDomain}`
        );
        const data = await res.json();
        backendMessages = (data.messages || []).map((msg, i) => ({
          id: msg.id || `local-${i}`,
          from: msg.sender || "unknown",
          message: msg.text || msg.content || "",
          created_time: msg.createdAt || new Date().toISOString(),
        }));
      }

      // WhatsApp
      else if (selectedPage.type === "whatsapp") {
        const res = await fetch(`/get-messages?number=${conv.userNumber}`);
        const data = await res.json();
        backendMessages = (data.messages || []).map((msg, i) => ({
          id: msg.id || `local-${i}`,
          from: { id: msg.sender || "unknown" },
          message: msg.content || "",
          created_time: msg.timestamp || new Date().toISOString(),
        }));
      }

      // FB/IG
      else {
        const token = pageAccessTokens[selectedPage.id];
        const res = await fetch(
          `https://graph.facebook.com/v18.0/${conv.id}/messages?fields=from,message,created_time&access_token=${token}`
        );
        const data = await res.json();
        backendMessages = (data.data || []).map((msg) => ({
          id: msg.id,
          from: msg.from,
          message: msg.message,
          created_time: msg.created_time,
        }));
      }

      setMessages((prev) => ({
        ...prev,
        [messageKey]: backendMessages,
      }));
    } catch (err) {
      console.error("Error fetching messages", err);
    }
  };

  // --- Send WhatsApp message ---
  const sendWhatsAppMessage = async () => {
    if (!selectedConversation?.userNumber) return alert("Select a user");

    setSendingMessage(true);
    try {
      const payload = {
        messaging_product: "whatsapp",
        to: selectedConversation.userNumber,
        type: "text",
        text: { body: newMessage },
      };

      await fetch(
        `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${WHATSAPP_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const localMsg = {
        id: "local-" + Date.now(),
        displayName: "You",
        message: newMessage,
        created_time: new Date().toISOString(),
        from: { id: "me" },
      };

      setMessages((prev) => ({
        ...prev,
        [selectedConversation.id]: [
          ...(prev[selectedConversation.id] || []),
          localMsg,
        ],
      }));

      setNewMessage("");
    } catch (error) {
      console.error(error);
      alert("Failed to send WhatsApp message");
    } finally {
      setSendingMessage(false);
    }
  };

  // --- Send message ---
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedPage || sendingMessage) return;

    // Widget
    if (selectedPage.type === "widget") {
      try {
        const res = await fetch("/api/sendMessage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            storeDomain: currentStoreDomain,
            sessionId: selectedConversation.sessionId,
            sender: "me",
            message: newMessage,
          }),
        });

        if (!res.ok) throw new Error("Widget send failed");
        setNewMessage("");
        await fetchMessages(selectedConversation);
      } catch (err) {
        console.error(err);
      }
      return;
    }

    // WhatsApp
    if (selectedPage.type === "whatsapp") {
      await sendWhatsAppMessage();
      return;
    }

    // Facebook / Instagram
    const token = pageAccessTokens[selectedPage.id];
    if (!token) return alert("Page token missing");

    try {
      if (selectedPage.type === "instagram") {
        const msgRes = await fetch(
          `https://graph.facebook.com/v18.0/${selectedConversation.id}/messages?fields=from&access_token=${token}`
        );
        const msgData = await msgRes.json();
        const sender = msgData?.data?.find((m) => m.from?.id !== selectedPage.igId);
        if (!sender) return alert("Recipient not found");

        await fetch(
          `https://graph.facebook.com/v18.0/me/messages?access_token=${token}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messaging_product: "instagram",
              recipient: { id: sender.from.id },
              message: { text: newMessage },
            }),
          }
        );
      } else {
        const participants = selectedConversation.participants?.data || [];
        const recipient = participants.find((p) => p.name !== selectedPage.name);
        if (!recipient) return alert("Recipient not found");

        await fetch(
          `https://graph.facebook.com/v18.0/me/messages?access_token=${token}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              recipient: { id: recipient.id },
              message: { text: newMessage },
              messaging_type: "MESSAGE_TAG",
              tag: "ACCOUNT_UPDATE",
            }),
          }
        );
      }

      setNewMessage("");
      await fetchMessages(selectedConversation);
    } catch (err) {
      console.error(err);
      alert("Failed to send message");
    }
  };






  
return (
  <div
    className="social-chat-dashboard"
    style={{ fontFamily: "Arial, sans-serif", maxWidth: 1200, margin: "auto" }}
  >
    <h1 style={{ textAlign: "center", margin: "20px 0" }}>
      📱 Social Chat Dashboard
    </h1>

    <div
      className="card for-box"
      style={{
        padding: 20,
        boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
        borderRadius: 8,
      }}
    >
      {/* Connection Buttons */}
     {/* Connection Buttons */}
<div style={{ textAlign: "center", marginBottom: 20 }}>
  <button
    onClick={handleFacebookLogin}
    disabled={fbConnected || loadingPages}
    className="btn-primary"
  >
    {loadingPages && !fbConnected
      ? "Loading..."
      : fbConnected
      ? "Facebook Connected"
      : "Connect Facebook"}
  </button>

  <div style={{ marginTop: 10 }}>
    <button
      onClick={handleInstagramLogin}
      disabled={igConnected || loadingPages}
      className="btn-primary"
    >
      {loadingPages && !igConnected
        ? "Loading..."
        : igConnected
        ? "Instagram Connected"
        : "Connect Instagram"}
    </button>
  </div>

  <div style={{ marginTop: 10 }}>
    <button
      onClick={handleWhatsAppConnect}
      disabled={waConnected}
      className="btn-primary"
    >
      {waConnected ? "WhatsApp Connected" : "Connect WhatsApp"}
    </button>
  </div>

  {/* ✅ New Chat Widget Button */}
  <div style={{ marginTop: 10 }}>
    <button
      onClick={handleWidgetConnect}
      disabled={selectedPage?.type === "widget"}
      className="btn-primary"
    >
      {selectedPage?.type === "widget"
        ? "Widget Connected"
        : "Connect Widget"}
    </button>
  </div>
</div>

      {/* Main 3-column chat UI */}
      {selectedPage && (
        <div
          style={{
            display: "flex",
            height: 650,
            border: "1px solid #ccc",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          {/* Pages Sidebar */}
          <div
            style={{
              width: "22%",
              borderRight: "1px solid #eee",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                padding: 12,
                borderBottom: "1px solid #ddd",
                background: "#f7f7f7",
                fontWeight: "600",
              }}
            >
              Pages
            </div>

   {[...fbPages, ...igPages].map((page) => (
  <div
    key={page.id}
    onClick={() => fetchConversations(page)}
    style={{
      padding: 12,
      cursor: "pointer",
      backgroundColor:
        selectedPage?.id === page.id ? "#e3f2fd" : "white",
      borderBottom: "1px solid #eee",
    }}
  >
    {page.name}{" "}
    <small style={{ color: "#888" }}>({page.type})</small>
  </div>
))}

{waConnected && (
  <div
    onClick={handleWhatsAppConnect}
    style={{
      padding: 12,
      cursor: "pointer",
      backgroundColor:
        selectedPage?.type === "whatsapp" ? "#e3f2fd" : "white",
      borderBottom: "1px solid #eee",
    }}
  >
    WhatsApp
  </div>
)}

{/* ✅ Show Widget tab only if connected */}
{widgetConnected && (
  <div
    onClick={handleWidgetConnect}
    style={{
      padding: 12,
      cursor: "pointer",
      backgroundColor:
        selectedPage?.type === "widget" ? "#e3f2fd" : "white",
      borderBottom: "1px solid #eee",
      fontWeight: "500",
    }}
  >
    Chat Widget Users
  </div>
)}


          </div>

          {/* Conversations List */}
          <div
            style={{
              width: "28%",
              borderRight: "1px solid #eee",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                padding: 12,
                borderBottom: "1px solid #ddd",
                background: "#f7f7f7",
                fontWeight: "600",
              }}
            >
              Conversations
            </div>
            {loadingConversations && (
              <div style={{ padding: 12 }}>Loading conversations...</div>
            )}
            {!loadingConversations && conversations.length === 0 && (
              <div style={{ padding: 12 }}>No conversations available.</div>
            )}
            {conversations.map((conv) => {
              const name =
                selectedPage?.type === "instagram"
                  ? `${conv.businessName} ↔️ ${conv.userName}`
                  : selectedPage?.type === "whatsapp"
                  ? conv.userName ||
                    conv.profile?.name ||
                    conv.contacts?.[0]?.profile?.name ||
                    conv.contacts?.[0]?.wa_id ||
                    conv.wa_id ||
                    "WhatsApp User"
                  : selectedPage?.type === "widget"
                  ? conv.userName || "Widget User"
                  : conv.participants?.data
                      ?.filter((p) => p.name !== selectedPage.name)
                      .map((p) => p.name)
                      .join(", ") || "User";

              return (
                <div
                  key={conv.id}
                  onClick={() => fetchMessages(conv)}
                  style={{
                    padding: 12,
                    cursor: "pointer",
                    backgroundColor:
                      selectedConversation?.id === conv.id
                        ? "#e7f1ff"
                        : "white",
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
            <div
              style={{
                padding: 12,
                borderBottom: "1px solid #ddd",
                background: "#f7f7f7",
                fontWeight: "600",
              }}
            >
              Chat
            </div>

            {/* Messages */}
            <div
              style={{
                flex: 1,
                padding: 12,
                overflowY: "auto",
                background: "#f9f9f9",
                display: "flex",
                flexDirection: "column",
              }}
            >
    {(messages[selectedConversation?.messageKey || selectedConversation?.id] || []).map(
  (msg) => {
    const fromId = msg.from?.id || msg.from;
    const isMe =
      fromId === WHATSAPP_RECIPIENT_NUMBER ||
      fromId === "me" ||
      fromId === selectedPage?.id;

    return (
      <div key={msg.id} style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            alignSelf: isMe ? "flex-end" : "flex-start",
            backgroundColor: isMe ? "#d1e7dd" : "#f0f0f0",
            padding: "10px 15px",
            borderRadius: 15,
            marginBottom: 8,
            maxWidth: "70%",
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
  }
)}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Box */}
            <div
              style={{
                display: "flex",
                padding: 12,
                borderTop: "1px solid #ddd",
              }}
            >
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message"
                style={{
                  flex: 1,
                  padding: 10,
                  borderRadius: 5,
                  border: "1px solid #ccc",
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                disabled={sendingMessage}
              />

              <button
                onClick={() => {
                  if (!sendingMessage && newMessage.trim()) {
                    sendMessage();
                  }
                }}
                disabled={sendingMessage || !newMessage.trim()}
                style={{
                  marginLeft: 10,
                  padding: "10px 20px",
                  backgroundColor: sendingMessage ? "#6c757d" : "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: 5,
                  cursor: sendingMessage ? "not-allowed" : "pointer",
                }}
              >
                {sendingMessage ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* Styles */}
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
        width: 15pc;
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
