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
        if (res.authResponse) {
          fetchFacebookPages(res.authResponse.accessToken);
        } else {
          alert("Facebook login failed.");
        }
      },
      {
        scope:
          "pages_show_list,pages_messaging,pages_read_engagement,pages_manage_posts",
      }
    );
  };

  const fetchFacebookPages = async (accessToken) => {
    try {
      const res = await fetch(
        `https://graph.facebook.com/me/accounts?fields=access_token,name,id&access_token=${accessToken}`
      );
      const data = await res.json();
      console.log("Pages API response:", data);

      if (!data?.data?.length) {
        alert("No pages found. Make sure you have admin access on at least one page.");
        return;
      }

      const tokens = {};
      const enrichedPages = data.data.map((page) => {
        tokens[page.id] = page.access_token;
        return { ...page, type: "facebook" };
      });

      setPageAccessTokens((prev) => ({ ...prev, ...tokens }));
      setFbPages(enrichedPages);
      setFbConnected(true);

      if (enrichedPages.length > 0) {
        fetchConversations(enrichedPages[0], tokens[enrichedPages[0].id]);
      }
    } catch (err) {
      console.error("Failed to fetch Facebook pages:", err);
    }
  };

  const fetchConversations = async (page, token) => {
    try {
      setSelectedPage(page);
      setSelectedConversation(null);
      setMessages([]);

      const res = await fetch(
        `https://graph.facebook.com/v18.0/${page.id}/conversations?fields=participants&access_token=${token}`
      );
      const data = await res.json();
      console.log("Fetched conversations:", data);

      setConversations(data.data || []);
    } catch (err) {
      console.error("Failed to fetch conversations:", err);
    }
  };

  const fetchMessages = async (conv) => {
    if (!selectedPage) return;
    const token = pageAccessTokens[selectedPage.id];

    const res = await fetch(
      `https://graph.facebook.com/v18.0/${conv.id}/messages?fields=from,message,created_time&access_token=${token}`
    );
    const data = await res.json();
    setMessages(data?.data?.reverse() || []);
    setSelectedConversation(conv);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedPage || !selectedConversation) return;
    const token = pageAccessTokens[selectedPage.id];

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

    setNewMessage("");
    fetchMessages(selectedConversation);
  };

  return (
    <Page title="📱 Social Chat Dashboard">
      <Card sectioned>
        {!fbConnected && (
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <Button onClick={handleFacebookLogin} primary>
              Connect Facebook
            </Button>
          </div>
        )}

        {fbConnected && (
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
            {/* Pages */}
            <div style={{ width: "22%", borderRight: "1px solid #eee", overflowY: "auto" }}>
              <div style={{ padding: 12, borderBottom: "1px solid #ddd" }}>
                <Text variant="headingMd">Pages</Text>
              </div>
              {fbPages.map((page) => (
                <div
                  key={page.id}
                  onClick={() => fetchConversations(page, pageAccessTokens[page.id])}
                  style={{
                    padding: 12,
                    cursor: "pointer",
                    backgroundColor: selectedPage?.id === page.id ? "#e3f2fd" : "white",
                  }}
                >
                  <Text>{page.name}</Text>
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
                const name = conv.participants.data
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
