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
  const [shopifySessions, setShopifySessions] = useState([]);
  const [showShopifyWidget, setShowShopifyWidget] = useState(false);
  const [loadingShopify, setLoadingShopify] = useState(false);

  // Loading states
  const [loadingPages, setLoadingPages] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  const messagesEndRef = useRef(null);

  const FACEBOOK_APP_ID = "544704651303656";
  const WHATSAPP_TOKEN =
    "EAAHvZAZB8ZCmugBPBXoZBZBjZCo9iIeGinLLOkdC3oKwWdg5OnXd0EeKjHeSueZCIs0Dg0hf7wZA6kefsklIUTZCnDB3ZBZA5yirJSloxClWfVEgWeZCONNKjNH8Xbq6XZCqnHaOZBMXYzlOzZAHxErLuDasv5AZCZBS4U3dyaewR8v8LGVu8ZAcrHPLujO64KzOrwMo74o8W31S6eZCpoPcwCgM3rAgusSA3u8WuTxo2IRY81r1ioqSAZDZD";
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
  }, [messages]);
  
    useEffect(() => {
    const interval = setInterval(fetchShopifySessions, 5000);
    return () => clearInterval(interval);
  }, []);


  const resetFbData = () => {
    setFbPages([]);
    setFbConnected(false);
    if (selectedPage?.type === "facebook") {
      setSelectedPage(null);
      setConversations([]);
      setMessages([]);
    }
  };
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

  /** Open Shopify conversation in dashboard */
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

  /** Send message for Shopify session */
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

  setSelectedConversation(conv);

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
    if (!newMessage.trim() || !selectedPage || !selectedConversation || sendingMessage) return;

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
  };
// When fetching messages
const fetchWidgetUserMessages = async (user) => {
  try {
    const res = await fetch(`/admin/chat/list?userId=${user.id}`);
    const data = await res.json();

    // Use user.id as string key
    setMessages((prev) => ({
      ...prev,
      [String(user.id)]: data.messages,
    }));
  } catch (err) {
    console.error("Failed to fetch widget user messages:", err);
  }
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
      {/* Connect Buttons */}
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

      {/* Main Grid */}
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
              onClick={() => fetchConversations({ type: "whatsapp" })}
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

          {/* Shopify Sessions */}
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
                  onClick={() => fetchConversations({ ...s, type: "shopify" })}
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

          {/* Widget Users Section */}
          {showShopifyWidget && widgetUsers.length > 0 && (
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
                Widget Users
              </div>
              {widgetUsers.map((user) => (
                <div
                  key={user.id}
                  onClick={async () => {
                    setSelectedConversation(user);
                    await fetchWidgetUserMessages(user); // fetch messages from /admin/chat/list
                  }}
                  style={{
                    padding: 12,
                    cursor: "pointer",
                    backgroundColor: selectedConversation?.id === user.id ? "#e3f2fd" : "white",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  {user.name || "User"} <br /> <small>{user.email || user.sessionId}</small>
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

          {(!selectedPage && !selectedConversation) && (
            <div style={{ padding: 12 }}>Select a page or widget user to see conversations.</div>
          )}

          {conversations.map((conv) => {
            let name = conv.userName || conv.sessionId || "User";
            return (
              <div
                key={conv.id || conv.sessionId}
                onClick={() => fetchMessages(conv)}
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

        {/* Chat Box */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ padding: 12, borderBottom: "1px solid #ddd", background: "#f7f7f7", fontWeight: "600" }}>
            Chat
          </div>

<div style={{ flex: 1, padding: 12, overflowY: "auto", background: "#f9f9f9", display: "flex", flexDirection: "column" }}>
  {selectedConversation ? (
    (messages[String(selectedConversation.id)] || []).map((msg) => {
      const isMe = msg.from === "me";
      return (
        <div key={msg.id} style={{ display: "flex", flexDirection: "column", marginBottom: 8 }}>
          <div style={{
            alignSelf: isMe ? "flex-end" : "flex-start",
            backgroundColor: isMe ? "#d1e7dd" : "#f0f0f0",
            padding: "10px 15px",
            borderRadius: 15,
            maxWidth: "70%",
          }}>
            <strong>{isMe ? "You" : msg.displayName || "User"}</strong>
            <div>{msg.message}</div>
            <small style={{ fontSize: 10, color: "#666" }}>
              {new Date(msg.created_time).toLocaleString()}
            </small>
          </div>
        </div>
      );
    })
  ) : (
    <div style={{ padding: 12, color: "#888" }}>Select a conversation to start chatting.</div>
  )}
  <div ref={messagesEndRef} />
</div>

          {selectedConversation && (
            <div style={{ display: "flex", padding: 12, borderTop: "1px solid #ddd" }}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message"
                style={{ flex: 1, padding: 10, borderRadius: 5, border: "1px solid #ccc" }}
                onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
              />
              <button onClick={sendMessage} style={{ marginLeft: 10, padding: "10px 20px", backgroundColor: "#007bff", color: "#fff", border: "none", borderRadius: 5 }}>Send</button>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Button Styles */}
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
