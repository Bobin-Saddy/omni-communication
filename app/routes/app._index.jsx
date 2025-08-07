import { useState, useEffect } from "react";

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
  const [showWaConnectModal, setShowWaConnectModal] = useState(false);

  const FACEBOOK_APP_ID = "544704651303656";
  const WHATSAPP_TOKEN = "EAAHvZAZB8ZCmugBPMA9abhl8iAbQJZCZCG2bUh6TOanHlaBsXDkZArjU6VkZC3P0ZAUwKJ7DJLK3trzuuvcYUwGJg7MmtRcd7fHCAYig66x93MUIhrqfOAgzQpHEMAwZCqoYiwYVzd46SY3Gr4C79HrQzdkb9BbxU8uKEQN2YnROmlzNPfeagLy0DAdwgZBD9ZB7aLoygT88QaNtZCfc3ttEAo3sj99vGYCZBTGqRAJEMIYP5IwZDZD";
  const WHATSAPP_PHONE_NUMBER_ID = "106660072463312";
  const WHATSAPP_RECIPIENT_NUMBER = "919779728764";

  useEffect(() => {
    window.fbAsyncInit = function () {
      window.FB.init({
        appId: FACEBOOK_APP_ID,
        cookie: true,
        xfbml: true,
        version: "v18.0",
      });
    };

    (function (d, s, id) {
      if (d.getElementById(id)) return;
      const js = d.createElement(s);
      js.id = id;
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      const fjs = d.getElementsByTagName(s)[0];
      fjs.parentNode.insertBefore(js, fjs);
    })(document, "script", "facebook-jssdk");
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

  const confirmWhatsAppConnect = () => {
    setWaConnected(true);
    setSelectedPage({
      id: "whatsapp",
      name: "WhatsApp",
      type: "whatsapp",
    });
    setConversations([
      {
        id: "wa-1",
        userName: "WhatsApp User",
        businessName: "You",
      },
    ]);
    setMessages([]);
    setShowWaConnectModal(false);
  };

  const fetchFacebookPages = async (accessToken) => {
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
    fetchConversations(pages[0]);
  };

  const fetchInstagramPages = async (accessToken) => {
    const res = await fetch(
      `https://graph.facebook.com/me/accounts?fields=access_token,name,id,instagram_business_account&access_token=${accessToken}`
    );
    const data = await res.json();

    if (!Array.isArray(data?.data)) {
      alert("Instagram account response is invalid.");
      return;
    }

    const igPages = data.data.filter((p) => p.instagram_business_account);
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
  };

  const fetchConversations = async (page) => {
    const token = pageAccessTokens[page.id];
    setSelectedPage(page);
    setSelectedConversation(null);
    setMessages([]);

    const res = await fetch(
      `https://graph.facebook.com/v18.0/${page.id}/conversations?${
        page.type === "instagram" ? "platform=instagram&" : ""
      }fields=participants&access_token=${token}`
    );
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
  };

  const fetchMessages = async (conv) => {
    if (!selectedPage) return;
    const token = pageAccessTokens[selectedPage.id];

    if (selectedPage.type === "whatsapp") {
      setSelectedConversation(conv);

      try {
        const res = await fetch(
          `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages?access_token=${WHATSAPP_TOKEN}`
        );
        const data = await res.json();

        if (!data?.data) {
          console.warn("No messages returned from WhatsApp API", data);
          setMessages([]);
          return;
        }

        const formatted = data.data
          .filter((msg) => msg.type === "text")
          .map((msg) => ({
            id: msg.id,
            displayName: msg.from === WHATSAPP_RECIPIENT_NUMBER ? "WhatsApp User" : "You",
            message: msg.text?.body || "",
            created_time: msg.timestamp ? new Date(Number(msg.timestamp) * 1000).toISOString() : new Date().toISOString(),
            from: { id: msg.from === WHATSAPP_RECIPIENT_NUMBER ? "user" : "me" },
          }));

        setMessages(formatted.reverse());
      } catch (error) {
        console.error("Failed to fetch WhatsApp messages", error);
        setMessages([]);
      }

      return;
    }

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

    setMessages(enrichedMessages);
    setSelectedConversation(conv);
  };

  const sendWhatsAppMessage = async () => {
    const payload = {
      messaging_product: "whatsapp",
      to: WHATSAPP_RECIPIENT_NUMBER,
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
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        displayName: "You",
        message: newMessage,
        created_time: new Date().toISOString(),
        from: { id: "me" },
      },
    ]);
    setNewMessage("");
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedPage || !selectedConversation) return;

    if (selectedPage.type === "whatsapp") {
      await sendWhatsAppMessage();
      return;
    }

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
    fetchMessages(selectedConversation);
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
            {/* Sidebar */}
            <div
              style={{ width: "22%", borderRight: "1px solid #eee", overflowY: "auto" }}
            >
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
                    backgroundColor:
                      selectedPage?.id === page.id ? "#e3f2fd" : "white",
                  }}
                >
                  <span>
                    {page.name} ({page.type})
                  </span>
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
                  }}
                >
                  <span>WhatsApp</span>
                </div>
              )}
            </div>

            {/* Conversations */}
            <div
              style={{ width: "28%", borderRight: "1px solid #eee", overflowY: "auto" }}
            >
              <div style={{ padding: 12, borderBottom: "1px solid #ddd" }}>
                <h3>Conversations</h3>
              </div>
              {conversations.length === 0 && (
                <div style={{ padding: 12 }}>No conversations available.</div>
              )}
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
                      backgroundColor:
                        selectedConversation?.id === conv.id ? "#e7f1ff" : "white",
                    }}
                  >
                    <span>{name}</span>
                  </div>
                );
              })}
            </div>

            {/* Chat */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <div style={{ padding: 12, borderBottom: "1px solid #ddd" }}>
                <h3>Chat</h3>
              </div>
              <div
                style={{
                  flex: 1,
                  padding: 12,
                  overflowY: "auto",
                  background: "#f9f9f9",
                }}
              >
                {messages.map((msg) => {
                  const isMe =
                    msg.from?.id === "me" || msg.from?.name === selectedPage?.name;
                  const bubbleStyle = {
                    display: "inline-block",
                    padding: 10,
                    borderRadius: 8,
                    backgroundColor: isMe ? "#d1e7dd" : "#f0f0f0",
                    border: "1px solid #ccc",
                    maxWidth: "80%",
                  };

                  return (
                    <div
                      key={msg.id}
                      style={{
                        textAlign: isMe ? "right" : "left",
                        marginBottom: 10,
                      }}
                    >
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
                  style={{
                    flex: 1,
                    padding: 10,
                    borderRadius: 5,
                    border: "1px solid #ccc",
                  }}
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


