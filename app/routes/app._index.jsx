import { useState, useEffect } from "react";
import { Page, Card, Button, Text, Badge, Layout, Spinner } from "@shopify/polaris";

export default function SocialChatDashboard() {
  const [fbPages, setFbPages] = useState([]);
  const [fbConnected, setFbConnected] = useState(false);
  const [igConnected, setIgConnected] = useState(false);
  const [selectedPage, setSelectedPage] = useState(null);
  const [pageAccessTokens, setPageAccessTokens] = useState({});
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [recipientId, setRecipientId] = useState(null);
  const [newMessages, setNewMessages] = useState({});
  const FACEBOOK_APP_ID = "544704651303656";

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

  const handleFacebookLogin = () => {
    window.FB.login(
      (response) => {
        if (response.authResponse) {
          fetchPages(response.authResponse.accessToken);
        }
      },
      {
        scope:
          "pages_show_list,pages_read_engagement,pages_manage_metadata,pages_messaging,pages_manage_posts",
      }
    );
  };

  const fetchPages = (userAccessToken) => {
    fetch(
      `https://graph.facebook.com/me/accounts?access_token=${userAccessToken}`
    )
      .then((res) => res.json())
      .then((data) => {
        const tokens = {};
        const pages = [];

        data?.data?.forEach((page) => {
          if (page.access_token) {
            tokens[page.id] = page.access_token;
            pages.push(page);
          }
        });

        setFbPages(pages);
        setPageAccessTokens((prev) => ({ ...prev, ...tokens }));
        setFbConnected(true);
      })
      .catch((err) => console.error("Error fetching pages", err));
  };

  const fetchConversations = (page) => {
    const accessToken = pageAccessTokens[page.id];
    setSelectedPage(page);
    setSelectedConversation(null);
    setMessages([]);
    setRecipientId(null);

    fetch(
      `https://graph.facebook.com/${page.id}/conversations?fields=participants&access_token=${accessToken}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data?.data) {
          setConversations(data.data);
          const newMsgs = {};
          data.data.forEach((conv) => (newMsgs[conv.id] = false));
          setNewMessages(newMsgs);
        }
      })
      .catch((err) => console.error("Error fetching conversations", err));
  };

  const fetchMessages = (conversation) => {
    if (!selectedPage) return;
    const accessToken = pageAccessTokens[selectedPage.id];
    setSelectedConversation(conversation);

    const recipient = conversation.participants.data.find(
      (p) => p.name !== selectedPage.name
    );
    setRecipientId(recipient?.id || null);

    fetch(
      `https://graph.facebook.com/${conversation.id}/messages?fields=message,from,created_time&access_token=${accessToken}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data?.data) {
          setMessages(data.data.reverse());
          setNewMessages((prev) => ({
            ...prev,
            [conversation.id]: false,
          }));
        }
      })
      .catch((err) => console.error("Error fetching messages", err));
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !recipientId || !selectedPage) return;

    const accessToken = pageAccessTokens[selectedPage.id];
    fetch(
      `https://graph.facebook.com/v18.0/me/messages?access_token=${accessToken}`,
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
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.message_id) {
          setNewMessage("");
          fetchMessages(selectedConversation);
        }
      })
      .catch((err) => console.error("Send message error", err));
  };

  return (
    <Page title="📱 Social Chat Dashboard">
      <Card sectioned>
        {!fbConnected && (
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <Button onClick={handleFacebookLogin} primary>
              Connect Facebook
            </Button>
            <div style={{ marginTop: 10 }}>
              <Button disabled>Connect Instagram (Coming Soon)</Button>
            </div>
          </div>
        )}

        {fbConnected && (
          <div
            style={{
              display: "flex",
              height: "600px",
              border: "1px solid #ccc",
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            {/* Pages List */}
            <div style={{ width: "25%", borderRight: "1px solid #eee", overflowY: "auto" }}>
              <div style={{ padding: 12, borderBottom: "1px solid #ddd" }}>
                <Text variant="headingMd">Pages</Text>
              </div>
              {fbPages.map((page) => (
                <div
                  key={page.id}
                  onClick={() => fetchConversations(page)}
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
            <div style={{ width: "30%", borderRight: "1px solid #eee", overflowY: "auto" }}>
              <div style={{ padding: 12, borderBottom: "1px solid #ddd" }}>
                <Text variant="headingMd">Conversations</Text>
              </div>
              {conversations.length === 0 && (
                <div style={{ padding: 12 }}>No conversations available.</div>
              )}
              {conversations.map((conv) => {
                const participantNames = conv.participants.data
                  .filter((p) => p.name !== selectedPage?.name)
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
                    <Text>{participantNames}</Text>
                    {newMessages[conv.id] && <Badge status="critical">New</Badge>}
                  </div>
                );
              })}
            </div>

            {/* Messages */}
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
                      }}
                    >
                      <strong>{msg.from?.name}</strong>
                      <div>{msg.message}</div>
                      <small>{new Date(msg.created_time).toLocaleString()}</small>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input */}
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
