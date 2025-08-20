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
const [widgetConnected, setWidgetConnected] = useState(false);

  // Loading states
  const [loadingPages, setLoadingPages] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  const messagesEndRef = useRef(null);

  const FACEBOOK_APP_ID = "544704651303656";
  const WHATSAPP_TOKEN =
    "EAAHvZAZB8ZCmugBPDf9mYpD8bmGLBNMjDgZBD1fnxTKaoMQz4tTifRQNLLcZBDQjHy9YRtxsGfJxa9TsrMMSzS72ZCiv1ROOw3GcZBeecSuuitjuwlqdbyUGihjd4kbMgxgF3EYOSmB9nWFcCgbfHEkM5qoKMbdv8fsom7rNvUF0SYZCIj3pBHhBTgTdObOCfQpLdGJvmsmSjo4E8fWoFfVs4ZAX3ju4m9rsZCUnCvnp4G8AYZD";
  const WHATSAPP_PHONE_NUMBER_ID = "106660072463312";
  const WHATSAPP_RECIPIENT_NUMBER = "919779728764";

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
const handleWidgetConnect = async () => {
  try {
    setSelectedPage({ id: "widget", type: "widget", name: "Chat Widget" });
    setLoadingConversations(true);

    const res = await fetch(`/api/chat?widget=true`);
    if (!res.ok) throw new Error("Failed to fetch widget sessions");

    const data = await res.json();
    setConversations(data.sessions || []);

    setWidgetConnected(true); // ✅ Mark widget as connected
  } catch (err) {
    console.error("Widget connect failed:", err);
  } finally {
    setLoadingConversations(false);
  }
};








  const handleWhatsAppConnect = async () => {
    setWaConnected(true);
    setSelectedPage({ id: "whatsapp", name: "WhatsApp", type: "whatsapp" });

    try {
      const res = await fetch("/get-whatsapp-users");
      const users = await res.json(); // [{ number: "919876543210", name: "John" }, ...]

      const convs = users.map((u, index) => ({
        id: `wa-${index}`,
        userName: u.name || u.number,
        businessName: "You",
        userNumber: u.number,
      }));

      setConversations(convs);
      setMessages([]);
      setSelectedConversation(null);
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
      maxWidth: 1300,
      margin: "auto",
      padding: "20px",
    }}
  >
    {/* Header */}
    <h1
      style={{
        textAlign: "center",
        marginBottom: "25px",
        fontSize: "30px",
        fontWeight: "700",
        color: "#1e293b",
      }}
    >
      📱 Social Chat Dashboard
    </h1>

    {/* Card */}
    <div
      style={{
        padding: 24,
        boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
        borderRadius: 16,
        background: "rgba(255, 255, 255, 0.9)",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Connection Buttons */}
      <div style={{ textAlign: "center", marginBottom: 30 }}>
        <button onClick={handleFacebookLogin} disabled={fbConnected || loadingPages} className="btn-primary">
          {fbConnected ? "✅ Facebook Connected" : "Connect Facebook"}
        </button>

        <div style={{ marginTop: 12 }}>
          <button onClick={handleInstagramLogin} disabled={igConnected || loadingPages} className="btn-primary">
            {igConnected ? "✅ Instagram Connected" : "Connect Instagram"}
          </button>
        </div>

        <div style={{ marginTop: 12 }}>
          <button onClick={handleWhatsAppConnect} disabled={waConnected} className="btn-primary">
            {waConnected ? "✅ WhatsApp Connected" : "Connect WhatsApp"}
          </button>
        </div>

        <div style={{ marginTop: 12 }}>
          <button onClick={handleWidgetConnect} disabled={selectedPage?.type === "widget"} className="btn-primary">
            {selectedPage?.type === "widget" ? "✅ Widget Connected" : "Connect Widget"}
          </button>
        </div>
      </div>

      {/* Main Layout */}
      {selectedPage && (
        <div
          style={{
            display: "flex",
            height: 650,
            border: "1px solid #e5e7eb",
            borderRadius: 14,
            overflow: "hidden",
            background: "#f9fafb",
          }}
        >
          {/* Sidebar (Pages) */}
          <div
            style={{
              width: "22%",
              background: "#f9fafb",
              borderRight: "1px solid #e5e7eb",
              overflowY: "auto",
            }}
          >
            <div style={{ padding: "14px 16px", borderBottom: "1px solid #e5e7eb", background: "#f3f4f6", fontWeight: "600" }}>
              Channels
            </div>
            {[...fbPages, ...igPages].map((page) => (
              <div
                key={page.id}
                onClick={() => fetchConversations(page)}
                style={{
                  padding: "12px 16px",
                  cursor: "pointer",
                  backgroundColor: selectedPage?.id === page.id ? "#e0f2fe" : "transparent",
                  borderBottom: "1px solid #eee",
                  transition: "background 0.2s",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                {page.type === "facebook" && "📘"}
                {page.type === "instagram" && "📸"}
                {page.name}
              </div>
            ))}
            {waConnected && (
              <div
                onClick={handleWhatsAppConnect}
                style={{
                  padding: "12px 16px",
                  cursor: "pointer",
                  backgroundColor: selectedPage?.type === "whatsapp" ? "#e0f2fe" : "transparent",
                  borderBottom: "1px solid #eee",
                  transition: "background 0.2s",
                  fontWeight: "500",
                }}
              >
                💬 WhatsApp
              </div>
            )}
            {widgetConnected && (
              <div
                onClick={handleWidgetConnect}
                style={{
                  padding: "12px 16px",
                  cursor: "pointer",
                  backgroundColor: selectedPage?.type === "widget" ? "#e0f2fe" : "transparent",
                  borderBottom: "1px solid #eee",
                  transition: "background 0.2s",
                  fontWeight: "500",
                }}
              >
                🧩 Chat Widget
              </div>
            )}
          </div>

          {/* Conversations */}
          <div style={{ width: "28%", borderRight: "1px solid #e5e7eb", overflowY: "auto", background: "#fff" }}>
            <div style={{ padding: "14px 16px", borderBottom: "1px solid #e5e7eb", background: "#f3f4f6", fontWeight: "600" }}>
              Conversations
            </div>
            {loadingConversations ? (
              <div style={{ padding: 14, color: "#6b7280" }}>Loading...</div>
            ) : conversations.length === 0 ? (
              <div style={{ padding: 14, color: "#6b7280" }}>No conversations</div>
            ) : (
              conversations.map((conv) => {
                const name =
                  selectedPage?.type === "instagram"
                    ? `${conv.businessName} ↔️ ${conv.userName}`
                    : selectedPage?.type === "whatsapp"
                    ? conv.userName || conv.contacts?.[0]?.wa_id || "WhatsApp User"
                    : selectedPage?.type === "widget"
                    ? conv.userName || "Widget User"
                    : conv.participants?.data?.map((p) => p.name).join(", ") || "User";

                return (
                  <div
                    key={conv.id}
                    onClick={() => fetchMessages(conv)}
                    style={{
                      padding: "12px 16px",
                      cursor: "pointer",
                      backgroundColor: selectedConversation?.id === conv.id ? "#e0f2fe" : "transparent",
                      borderBottom: "1px solid #eee",
                      transition: "background 0.2s",
                    }}
                  >
                    {name}
                  </div>
                );
              })
            )}
          </div>

          {/* Chat Area */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#f9fafb" }}>
            {/* Chat Header */}
            <div style={{ padding: "14px 16px", borderBottom: "1px solid #e5e7eb", background: "#f3f4f6", fontWeight: "600" }}>
              Chat
            </div>

            {/* Messages */}
            <div
              style={{
                flex: 1,
                padding: 20,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              {(messages[selectedConversation?.messageKey || selectedConversation?.id] || []).map((msg) => {
                const fromId = msg.from?.id || msg.from;
                const isMe = fromId === "me" || fromId === selectedPage?.id;
                const bubbleStyle = {
                  padding: "12px 16px",
                  borderRadius: 18,
                  maxWidth: "65%",
                  fontSize: 14,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  wordBreak: "break-word",
                };

                return (
                  <div key={msg.id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start" }}>
                    <div
                      style={{
                        ...bubbleStyle,
                        background: isMe ? "#2563eb" : "#e5e7eb",
                        color: isMe ? "#fff" : "#111827",
                      }}
                    >
                      {!isMe && (
                        <div style={{ fontSize: 12, fontWeight: "600", marginBottom: 4 }}>
                          {msg.displayName || "User"}
                        </div>
                      )}
                      <div>{msg.message}</div>
                      <small style={{ display: "block", marginTop: 4, fontSize: 11, opacity: 0.7 }}>
                        {new Date(msg.created_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </small>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{ display: "flex", padding: 12, borderTop: "1px solid #e5e7eb", background: "#fff" }}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  borderRadius: 20,
                  border: "1px solid #d1d5db",
                  fontSize: 14,
                  outline: "none",
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
                onClick={() => !sendingMessage && newMessage.trim() && sendMessage()}
                disabled={sendingMessage || !newMessage.trim()}
                style={{
                  marginLeft: 10,
                  padding: "10px 20px",
                  backgroundColor: sendingMessage ? "#9ca3af" : "#2563eb",
                  color: "white",
                  border: "none",
                  borderRadius: 50,
                  fontWeight: "500",
                  cursor: sendingMessage ? "not-allowed" : "pointer",
                  transition: "background 0.3s",
                }}
              >
                {sendingMessage ? "..." : "➤"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* Styles */}
    <style>{`
      .btn-primary {
        background: #111827;
        color: white;
        padding: 12px 22px;
        border: none;
        border-radius: 10px;
        font-size: 15px;
        font-weight: 500;
        cursor: pointer;
        width: 240px;
        transition: all 0.3s ease;
      }
      .btn-primary:disabled {
        background-color: #9ca3af;
        cursor: not-allowed;
      }
      .btn-primary:not(:disabled):hover {
        background-color: #1f2937;
      }
      /* Smooth scrollbar */
      ::-webkit-scrollbar {
        width: 6px;
      }
      ::-webkit-scrollbar-thumb {
        background: rgba(0,0,0,0.2);
        border-radius: 10px;
      }
    `}</style>
  </div>
);



}
