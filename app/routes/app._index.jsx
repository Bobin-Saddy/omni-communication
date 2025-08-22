import { useState, useEffect, useRef } from "react";

export default function SocialChatDashboard() {
  const [activeTab, setActiveTab] = useState("settings"); // 
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
const [widgetConnected, setWidgetConnected] = useState(false);

  // Loading states
  const [loadingPages, setLoadingPages] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  const messagesEndRef = useRef(null);

  const FACEBOOK_APP_ID = "544704651303656";
  const WHATSAPP_TOKEN =
    "EAAHvZAZB8ZCmugBPPcWtoSpR6v6t8KZAQparjK3EKwr1nQK2wiVwtSRM2o9MuDCe0GuyexCj0ojTzAWN4CB4ZAhopUtk7uFv4CQU7TOIxxdZC2YUv8IMWIf5TTqUTtFvmknzRMe2IwN3zGfP6piVHSvYZCiCGwkI6xmvYK0gzQiKhA7aCZBZCo3Lvsv4DNHYjPk1N9T1gXxv8I0r7sErm28Rq9l0UcIB8FtUUZCgIeMPSnjAZDZD";
  const WHATSAPP_PHONE_NUMBER_ID = "106660072463312";
  // const WHATSAPP_RECIPIENT_NUMBER = "919779728764";

  const [currentStoreDomain, setCurrentStoreDomain] = useState(null);

// set it when user selects a store or on mount
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const shop = urlParams.get("shop");
  if (shop) setCurrentStoreDomain(shop);
}, []);


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
  }, [messages]);

  const resetFbData = () => {
    setFbPages([]);
    setFbConnected(false);
    if (selectedPage?.type === "facebook") {
      setSelectedPage(null);
      setConversations([]);
      setMessages([]);
    }
  };

  const resetIgData = () => {
    setIgPages([]);
    setIgConnected(false);
    if (selectedPage?.type === "instagram") {
      setSelectedPage(null);
      setConversations([]);
      setMessages([]);
    }
  };

const handleFacebookLogin = () => {
  window.FB.login(
    (res) => {
      if (res.authResponse) {
        resetIgData();
        fetchFacebookPages(res.authResponse.accessToken).then((pages) => {
          if (pages && pages.length > 0) {
            setSelectedPage({ ...pages[0], type: "facebook" }); // ✅ auto select first FB page
            fetchConversations(pages[0]); // ✅ auto fetch conversations
          }
          setFbConnected(true);
        });
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
        fetchInstagramPages(res.authResponse.accessToken).then((pages) => {
          if (pages && pages.length > 0) {
            setSelectedPage({ ...pages[0], type: "instagram" }); // ✅ auto select first IG page
            fetchConversations(pages[0]);
          }
          setIgConnected(true);
        });
      }
    },
    {
      scope:
        "pages_show_list,instagram_basic,instagram_manage_messages,pages_read_engagement,pages_manage_metadata",
    }
  );
};

const handleWidgetConnect = async () => {
  try {
    setLoadingConversations(true);
    const res = await fetch(`/api/chat?widget=true`);
    if (!res.ok) throw new Error("Failed to fetch widget sessions");

    const data = await res.json();
    setConversations(data.sessions || []);

    setSelectedPage({ id: "widget", type: "widget", name: "Chat Widget" }); // ✅ auto select widget
    setWidgetConnected(true);
  } catch (err) {
    console.error("Widget connect failed:", err);
  } finally {
    setLoadingConversations(false);
  }
};

const handleWhatsAppConnect = async () => {
  try {
    const res = await fetch("/get-whatsapp-users");
    const users = await res.json(); // [{ number: "919876543210", name: "John" }]

    const convs = users.map((u, index) => ({
      id: `wa-${index}`,
      userName: u.name || u.number,
      businessName: "You",
      userNumber: u.number,
    }));

    setConversations(convs);
    setMessages([]);
    setSelectedConversation(null);

    setSelectedPage({ id: "whatsapp", name: "WhatsApp", type: "whatsapp" }); // ✅ auto select WA
    setWaConnected(true);
  } catch (error) {
    alert("Failed to fetch WhatsApp users.");
    console.error(error);
  }
};


  const fetchFacebookPages = async (accessToken) => {
    setLoadingPages(true);
    try {
      const res = await fetch(
        `https://graph.facebook.com/me/accounts?fields=access_token,name,id&access_token=${accessToken}`
      );
      const data = await res.json();

      if (!Array.isArray(data?.data) || data.data.length === 0) {
        alert("No Facebook pages found.");
        setLoadingPages(false);
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

  const fetchInstagramPages = async (accessToken) => {
    setLoadingPages(true);
    try {
      const res = await fetch(
        `https://graph.facebook.com/me/accounts?fields=access_token,name,id,instagram_business_account&access_token=${accessToken}`
      );
      const data = await res.json();

      if (!Array.isArray(data?.data)) {
        alert("Instagram account response is invalid.");
        setLoadingPages(false);
        return;
      }

      const igPages = data.data.filter((p) => p.instagram_business_account);
      if (igPages.length === 0) {
        alert("No Instagram business accounts found.");
        setLoadingPages(false);
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

  const fetchConversations = async (page) => {
    setLoadingConversations(true);
    try {
      const token = pageAccessTokens[page.id];
      setSelectedPage(page);
      setSelectedConversation(null);
      setMessages([]);

      const url = `https://graph.facebook.com/v18.0/${page.id}/conversations?fields=participants&access_token=${token}`;
      const urlWithPlatform =
        page.type === "instagram"
          ? `https://graph.facebook.com/v18.0/${page.id}/conversations?platform=instagram&fields=participants&access_token=${token}`
          : url;

      const res = await fetch(urlWithPlatform);
      const data = await res.json();

      if (page.type === "instagram") {
        const enriched = await Promise.all(
          (data.data || []).map(async (conv) => {
            const msgRes = await fetch(
              `https://graph.facebook.com/v18.0/${conv.id}/messages?fields=from,message&limit=5&access_token=${token}`
            );
            const msgData = await msgRes.json();
            const messages = msgData?.data || [];
            const otherMsg = messages.find((m) => m.from?.id !== page.igId);
            let userName = "Instagram User";
            if (otherMsg) {
              userName = otherMsg.from?.name || otherMsg.from?.username || "Instagram User";
            }

            return {
              ...conv,
              userName,
              businessName: page.name,
            };
          })
        );
        setConversations(enriched);
      } else {
        setConversations(data.data || []);
      }
    } catch (error) {
      alert("Error fetching conversations.");
      console.error(error);
    } finally {
      setLoadingConversations(false);
    }
  };

const fetchMessages = async (conv) => {
  if (!selectedPage) return;

  // Determine message key (for widget use sessionId, otherwise use conversation id)
   const messageKey = selectedPage.type === "widget" ? conv.sessionId : conv.id;
  setSelectedConversation({ ...conv, messageKey });

  if (selectedPage.type === "widget") {
    if (!conv.sessionId || !conv.storeDomain) return;

    try {
      const url = `/api/chat?session_id=${encodeURIComponent(
        conv.sessionId
      )}&store_domain=${encodeURIComponent(conv.storeDomain)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();

      const backendMessages = (data.messages || []).map((msg, index) => ({
        id: msg.id || `local-${index}`,
        from: msg.sender || "unknown",
        message: msg.text || msg.content || "",
        created_time: msg.createdAt
          ? new Date(msg.createdAt).toISOString()
          : new Date().toISOString(),
      }));

      setMessages((prevMessages) => ({
        ...prevMessages,
        [messageKey]: backendMessages,
      }));
    } catch (err) {
      console.error("Widget fetch failed:", err);
    }
    return;
  }

  // ✅ WhatsApp
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
        id: msg.id || `local-${index}`,
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

const localMessagesNotInBackend = prevConvMessages.filter(
  (localMsg) =>
    localMsg.id &&
    typeof localMsg.id === "string" &&
    localMsg.id.startsWith("local-") &&
    !backendMessages.some(
      (bm) =>
        bm.message?.trim() === localMsg.message?.trim() &&
        Math.abs(
          new Date(bm.created_time) - new Date(localMsg.created_time)
        ) < 5000
    )
);

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

  // ✅ Widget
  if (selectedPage.type === "widget") {
    if (!conv.sessionId || !conv.storeDomain) {
      console.error("Widget conversation missing sessionId or storeDomain");
      return;
    }

    try {
      const url = `/api/chat?session_id=${encodeURIComponent(
        conv.sessionId
      )}&store_domain=${encodeURIComponent(conv.storeDomain)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();

      let backendMessages = [];

      if (data.messages) {
        backendMessages = data.messages.map((msg, index) => ({
          id: msg.id || `local-${index}`,
          from: msg.sender || "unknown",
          message: msg.text || msg.content || "",
          created_time: msg.createdAt
            ? new Date(msg.createdAt).toISOString()
            : new Date().toISOString(),
        }));
      }

      setMessages((prevMessages) => ({
        ...prevMessages,
        [messageKey]: backendMessages, // use messageKey here
      }));

      // selectedConversation already set with messageKey above
    } catch (err) {
      console.error("Error fetching Widget messages", err);
      alert("Failed to fetch Widget messages.");
    }

    return;
  }

  // --- Other platform logic (Facebook, Instagram, etc.) ---
  try {
    const platformUrl = `/admin/chat/list?conversationId=${encodeURIComponent(
      conv.id
    )}`;
    const res = await fetch(platformUrl);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();

    let platformMessages = [];

    if (data.messages) {
      platformMessages = data.messages.map((msg, index) => ({
        id: msg.id || `local-${index}`,
        from: msg.sender || "unknown",
        message: msg.text || msg.content || "",
        created_time: msg.createdAt
          ? new Date(msg.createdAt).toISOString()
          : new Date().toISOString(),
      }));
    }

    setMessages((prevMessages) => ({
      ...prevMessages,
      [conv.id]: platformMessages,
    }));

    setSelectedConversation(conv);
  } catch (err) {
    console.error("Error fetching platform messages", err);
    alert("Failed to fetch messages.");
  }

  // ✅ Facebook & Instagram
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
};




const sendWhatsAppMessage = async () => {
  if (!selectedConversation?.userNumber) return alert("Select a WhatsApp user first");

  setSendingMessage(true);
  try {
    const payload = {
      messaging_product: "whatsapp",
      to: selectedConversation.userNumber,
      type: "text",
      text: { body: newMessage },
    };

    const res = await fetch(
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

    const data = await res.json();
    console.log("WhatsApp send response", data);

    // Save message in your DB backend
    await fetch("/save-whatsapp-message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: selectedConversation.userNumber,
        from: WHATSAPP_PHONE_NUMBER_ID,
        message: newMessage,
        direction: "outgoing",
      }),
    });

    // Add local message immediately only for current conversation
    const localMsg = {
      id: "local-" + Date.now().toString(),
      displayName: "You",
      message: newMessage,
      created_time: new Date().toISOString(),
      from: { id: "me" },
    };

    setMessages((prev) => {
      const prevConvMessages = prev[selectedConversation.id] || [];
      return {
        ...prev,
        [selectedConversation.id]: [...prevConvMessages, localMsg],
      };
    });

    setNewMessage("");

    // Refresh messages for the current conversation
    await fetchMessages(selectedConversation);
  } catch (error) {
    alert("Failed to send WhatsApp message.");
    console.error(error);
  } finally {
    setSendingMessage(false);
  }
};

const sendMessage = async () => {
  if (!newMessage.trim() || !selectedPage || sendingMessage) return;

  setSendingMessage(true);

  try {
    // --- Widget messages ---
    if (selectedPage.type === "widget") {
      if (!newMessage.trim() || !selectedConversation?.sessionId || !currentStoreDomain) {
        alert("storeDomain and sessionId are required");
        return;
      }

      try {
        const response = await fetch("/api/sendMessage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            storeDomain: currentStoreDomain,
            sessionId: selectedConversation.sessionId,
            sender: "me",
            message: newMessage,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          console.error(result.error);
          alert("Failed to send widget message: " + result.error);
          return;
        }

        setNewMessage("");
        await fetchMessages(selectedConversation); // reload messages
      } catch (error) {
        console.error(error);
        alert("Failed to send widget message. Check console for details.");
      } finally {
        setSendingMessage(false);
      }
      return;
    }

    // --- WhatsApp messages ---
    if (selectedPage.type === "whatsapp") {
      await sendWhatsAppMessage();
      return;
    }

    // --- Instagram & Facebook ---
    const token = pageAccessTokens[selectedPage.id];
    if (!token) {
      alert("Page token missing");
      return;
    }

    let recipientId;

    if (selectedPage.type === "instagram") {
      // Get recipient for Instagram
      const msgRes = await fetch(
        `https://graph.facebook.com/v18.0/${selectedConversation.id}/messages?fields=from&access_token=${token}`
      );
      const msgData = await msgRes.json();
      const sender = msgData?.data?.find(
        (m) => m.from?.id !== selectedPage.igId
      );
      if (!sender) {
        alert("Recipient not found for Instagram");
        return;
      }
      recipientId = sender.from.id;

      await fetch(
        `https://graph.facebook.com/v18.0/me/messages?access_token=${token}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messaging_product: "instagram",
            recipient: { id: recipientId },
            message: { text: newMessage },
          }),
        }
      );
    } else {
      // Get recipient for Facebook
      const participants = selectedConversation.participants?.data || [];
      const recipient = participants.find(
        (p) => p.name !== selectedPage.name
      );
      if (!recipient) {
        alert("Recipient not found for Facebook");
        return;
      }
      recipientId = recipient.id;

      await fetch(
        `https://graph.facebook.com/v18.0/me/messages?access_token=${token}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipient: { id: recipientId },
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
    alert("Failed to send message. Check console for details.");
  } finally {
    setSendingMessage(false);
  }
};





  
return (
  <div
    className="social-chat-dashboard"
    style={{
      fontFamily: "Inter, Arial, sans-serif",
      maxWidth: 1400,
      margin: "auto",
      padding: "20px",
      background: "linear-gradient(135deg, #eef2f7, #f9fafc)",
      minHeight: "100vh",
    }}
  >
    {/* Header */}
    <h1
      style={{
        textAlign: "center",
        marginBottom: "25px",
        fontSize: "32px",
        fontWeight: "800",
        color: "#111827",
        letterSpacing: "-0.5px",
      }}
    >
      ✨ Omni-Communication Dashboard
    </h1>

    {/* Main Layout */}
    <div
      style={{
        display: "flex",
        minHeight: 680,
        border: "1px solid rgba(0,0,0,0.06)",
        borderRadius: 20,
        overflow: "hidden",
        background: "rgba(255,255,255,0.85)",
        boxShadow: "0 8px 30px rgba(0,0,0,0.06)",
        backdropFilter: "blur(14px)",
      }}
    >
      {/* Left Sidebar Navigation */}
      <div
        style={{
          width: "20%",
          background: "rgba(248,250,252,0.9)",
          borderRight: "1px solid #e5e7eb",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "16px",
            borderBottom: "1px solid #e5e7eb",
            background: "rgba(243,244,246,0.8)",
            fontWeight: "700",
            fontSize: 16,
          }}
        >
          🚀 Navigation
        </div>

        {/* Nav Buttons */}
        <button
          onClick={() => setActiveTab("home")}
          className="btn-nav"
          style={{
            backgroundColor: activeTab === "home" ? "#e0f2fe" : "transparent",
          }}
        >
          🏠 Home
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className="btn-nav"
          style={{
            backgroundColor: activeTab === "settings" ? "#e0f2fe" : "transparent",
          }}
        >
          ⚙️ Settings
        </button>
        <button
          onClick={() => setActiveTab("conversations")}
          className="btn-nav"
          style={{
            backgroundColor:
              activeTab === "conversations" ? "#e0f2fe" : "transparent",
          }}
        >
          💬 Conversations
        </button>
      </div>

      {/* Right Content Area */}
      <div style={{ flex: 1, padding: 26, background: "#fff" }}>
        {/* HOME TAB */}
        {activeTab === "home" && (
          <div>
            <h2
              style={{
                fontSize: 24,
                fontWeight: 700,
                marginBottom: 14,
                color: "#0f172a",
              }}
            >
              👋 Welcome to Omni-Communication
            </h2>
            <p style={{ color: "#475569", lineHeight: 1.6, fontSize: 15 }}>
              Manage conversations from <b>Facebook, Instagram, WhatsApp</b>,
              and your <b>chat widget</b> – all unified in one dashboard.
            </p>
            <p style={{ marginTop: 14, color: "#475569", fontSize: 15 }}>
              Use <b>Settings</b> to connect your channels or head over to{" "}
              <b>Conversations</b> to start chatting.
            </p>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === "settings" && (
          <div style={{ textAlign: "center" }}>
            <button
              onClick={handleFacebookLogin}
              disabled={fbConnected}
              className="btn-primary"
            >
              {fbConnected ? "✅ Facebook Connected" : "🔵 Connect Facebook"}
            </button>
            <br />
            <button
              onClick={handleInstagramLogin}
              disabled={igConnected}
              className="btn-primary"
            >
              {igConnected ? "✅ Instagram Connected" : "📸 Connect Instagram"}
            </button>
            <br />
            <button
              onClick={handleWhatsAppConnect}
              disabled={waConnected}
              className="btn-primary"
            >
              {waConnected ? "✅ WhatsApp Connected" : "💬 Connect WhatsApp"}
            </button>
            <br />
            <button
              onClick={handleWidgetConnect}
              disabled={widgetConnected}
              className="btn-primary"
            >
              {widgetConnected ? "✅ Widget Connected" : "🧩 Connect Widget"}
            </button>
          </div>
        )}

        {/* CONVERSATIONS TAB */}
        {activeTab === "conversations" && (
          <div
            style={{
              display: "flex",
              height: 600,
              border: "1px solid #e5e7eb",
              borderRadius: 16,
              overflow: "hidden",
              background: "#f8fafc",
            }}
          >
            {/* Sidebar + Chat Area */}
            <div style={{ flex: 1, display: "flex" }}>
              {/* Channels + Conversations already in your structure */}
              {/* ... keep your existing logic here ... */}

              {/* Example Chat Input Upgrade */}
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
                    boxShadow: "0 2px 6px rgba(0,0,0,0.06) inset",
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") sendMessage();
                  }}
                  disabled={sendingMessage}
                />
                <button
                  onClick={() =>
                    !sendingMessage && newMessage.trim() && sendMessage()
                  }
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
                    transition: "transform 0.2s ease, background 0.3s ease",
                  }}
                  onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.95)"}
                  onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
                >
                  {sendingMessage ? "..." : "➤"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Styles */}
    <style>{`
      .btn-primary {
        background: linear-gradient(135deg,#111827,#1f2937);
        color: white;
        padding: 14px 26px;
        border: none;
        border-radius: 12px;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
        width: 260px;
        margin: 8px 0;
        transition: all 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      }
      .btn-primary:disabled {
        background: #9ca3af;
        cursor: not-allowed;
        box-shadow: none;
      }
      .btn-primary:not(:disabled):hover {
        background: linear-gradient(135deg,#1e293b,#111827);
        transform: translateY(-1px);
      }
      .btn-nav {
        text-align: left;
        padding: 16px 18px;
        border: none;
        background: transparent;
        font-size: 15px;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s ease;
      }
      .btn-nav:hover {
        background: #f1f5f9;
        border-radius: 8px;
      }
    `}</style>
  </div>
);






}
