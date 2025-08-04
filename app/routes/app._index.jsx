import { useState, useEffect } from "react";
import { Page, Card, Button, Text } from "@shopify/polaris";

export default function SocialChatDashboard() {
  const [fbPages, setFbPages] = useState([]);
  const [igPages, setIgPages] = useState([]);
  const [fbConnected, setFbConnected] = useState(false);
  const [igConnected, setIgConnected] = useState(false);
  const [selectedPage, setSelectedPage] = useState(null);
  const [pageAccessTokens, setPageAccessTokens] = useState({});
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  const FACEBOOK_APP_ID = "544704651303656";

  useEffect(() => {
    window.fbAsyncInit = function () {
      window.FB.init({
        appId: FACEBOOK_APP_ID,
        cookie: true,
        xfbml: true,
        version: "v18.0",
      });
      console.log("FB SDK initialized");
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

  const handleFacebookLogin = () => {
    window.FB.login(
      (res) => {
        if (res.authResponse) fetchPages(res.authResponse.accessToken, "facebook");
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
        if (res.authResponse) fetchPages(res.authResponse.accessToken, "instagram");
      },
      {
        scope:
          "pages_show_list,instagram_basic,instagram_manage_messages,pages_read_engagement,pages_manage_metadata",
      }
    );
  };

  const fetchPages = async (token, platform) => {
    const res = await fetch(
      `https://graph.facebook.com/me/accounts?fields=${
        platform === "instagram" ? "instagram_business_account" : ""
      },access_token,name,id&access_token=${token}`
    );
    const data = await res.json();

    if (!data?.data?.length) return alert("No pages found.");

    const tokens = {};
    const filteredPages = data.data.filter((p) =>
      platform === "instagram" ? p.instagram_business_account : true
    );

    filteredPages.forEach((page) => {
      tokens[page.id] = page.access_token;
    });

    setPageAccessTokens((prev) => ({ ...prev, ...tokens }));

    const enrichedPages = filteredPages.map((p) => ({
      ...p,
      type: platform,
    }));

    if (platform === "facebook") {
      setFbPages(enrichedPages);
      setFbConnected(true);
    } else {
      setIgPages(enrichedPages);
      setIgConnected(true);
    }

    if (enrichedPages.length > 0) {
      fetchConversations(enrichedPages[0], tokens[enrichedPages[0].id]);
    }
  };

  const fetchConversations = async (page, token) => {
    setSelectedPage(page);
    setSelectedConversation(null);
    setMessages([]);

    const res = await fetch(
      `https://graph.facebook.com/v18.0/${page.id}/conversations?${
        page.type === "instagram" ? "platform=instagram&" : ""
      }fields=participants&access_token=${token}`
    );
    const data = await res.json();

    if (!res.ok) {
      console.error("Error fetching conversations:", await res.text());
      return;
    }

    if (page.type === "instagram") {
      const enriched = await Promise.all(
        (data.data || []).map(async (conv) => {
          const msgRes = await fetch(
            `https://graph.facebook.com/v18.0/${conv.id}/messages?fields=from,message&limit=1&access_token=${token}`
          );
          const msgData = await msgRes.json();
          const msg = msgData?.data?.[0];
          return {
            ...conv,
            userName: msg?.from?.name || msg?.from?.username || "User",
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
    setSelectedConversation(conv);
    const token = pageAccessTokens[selectedPage.id];

    const res = await fetch(
      `https://graph.facebook.com/v18.0/${conv.id}/messages?fields=from,message,created_time&access_token=${token}`
    );
    const data = await res.json();
    setMessages(data?.data?.reverse() || []);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedPage || !selectedConversation) return;
    const token = pageAccessTokens[selectedPage.id];

    if (selectedPage.type === "instagram") {
      const msgRes = await fetch(
        `https://graph.facebook.com/v18.0/${selectedConversation.id}/messages?fields=from&access_token=${token}`
      );
      const msgData = await msgRes.json();
      const sender = msgData.data.find(
        (m) => m.from?.id !== selectedPage.instagram_business_account?.id
      );
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
      const participants = selectedConversation.participants.data;
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
    <Page title="📱 Social Chat Dashboard">
      <Card sectioned>
        {!fbConnected && !igConnected && (
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <Button onClick={handleFacebookLogin} primary>
              Connect Facebook
            </Button>
            <div style={{ marginTop: 10 }}>
              <Button onClick={handleInstagramLogin}>Connect Instagram</Button>
            </div>
          </div>
        )}

        {(fbConnected || igConnected) && (
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
            {/* Pages List */}
            <div style={{ width: "22%", borderRight: "1px solid #eee", overflowY: "auto" }}>
              <div style={{ padding: 12, borderBottom: "1px solid #ddd" }}>
                <Text variant="headingMd">Pages</Text>
              </div>
              {[...fbPages, ...igPages].map((page) => (
                <div
                  key={page.id}
                  onClick={() => fetchConversations(page, pageAccessTokens[page.id])}
                  style={{
                    padding: 12,
                    cursor: "pointer",
                    backgroundColor: selectedPage?.id === page.id ? "#e3f2fd" : "white",
                  }}
                >
                  <Text>{page.name} ({page.type})</Text>
                </div>
              ))}
            </div>

            {/* Conversations */}
            <div style={{ width: "28%", borderRight: "1px solid #eee", overflowY: "auto" }}>
              <div style={{ padding: 12, borderBottom: "1px solid #ddd" }}>
                <Text variant="headingMd">Conversations</Text>
              </div>
              {conversations.length === 0 && (
                <div style={{ padding: 12 }}>No conversations available.</div>
              )}
              {conversations.map((conv) => {
                const name =
                  selectedPage?.type === "instagram"
                    ? `${conv.businessName} ↔️ ${conv.userName}`
                    : conv.participants.data
                        .filter((p) => p.name !== selectedPage.name)
                        .map((p) => p.name)
                        .join(", ");
                return (
                  <div
                    key={conv.id}
                    onClick={() => fetchMessages(conv)}
                    style={{
                      padding: 12,
                      cursor: "pointer",
                      backgroundColor: selectedConversation?.id === conv.id ? "#e7f1ff" : "white",
                    }}
                  >
                    <Text>{name}</Text>
                  </div>
                );
              })}
            </div>

            {/* Chat */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <div style={{ padding: 12, borderBottom: "1px solid #ddd" }}>
                <Text variant="headingMd">Chat</Text>
              </div>
              <div style={{ flex: 1, padding: 12, overflowY: "auto", background: "#f9f9f9" }}>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      textAlign: msg.from?.name === selectedPage?.name ? "right" : "left",
                      marginBottom: 10,
                    }}
                  >
                    <div
                      style={{
                        display: "inline-block",
                        padding: 10,
                        borderRadius: 8,
                        backgroundColor:
                          msg.from?.name === selectedPage?.name ? "#d1e7dd" : "white",
                        border: "1px solid #ccc",
                        maxWidth: "80%",
                      }}
                    >
                      <strong>{msg.from?.name}</strong>
                      <div>{msg.message}</div>
                      <small>{new Date(msg.created_time).toLocaleString()}</small>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", padding: 12, borderTop: "1px solid #ddd" }}>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message"
                  style={{ flex: 1, padding: 10, borderRadius: 5, border: "1px solid #ccc" }}
                />
                <Button onClick={sendMessage} primary style={{ marginLeft: 10 }}>
                  Send
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </Page>
  );
}
