import { useState, useEffect } from "react";
import { Page, Card, Button, Text, Avatar, TextField } from "@shopify/polaris";

export default function FacebookPagesConversations() {
  const [isConnected, setIsConnected] = useState(false);
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [pageAccessTokens, setPageAccessTokens] = useState({});

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
      var js,
        fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) return;
      js = d.createElement(s);
      js.id = id;
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      fjs.parentNode.insertBefore(js, fjs);
    })(document, "script", "facebook-jssdk");
  }, []);

  const handleFacebookLogin = () => {
    window.FB.login(
      (response) => {
        if (response.authResponse) {
          fetchPages(response.authResponse.accessToken);
        } else {
          console.log("User cancelled login or did not fully authorize.");
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
        if (data.data && data.data.length > 0) {
          const tokens = {};
          data.data.forEach((page) => {
            tokens[page.id] = page.access_token;
          });
          setPageAccessTokens(tokens);
          setPages(data.data);
          setIsConnected(true);
        }
      })
      .catch((err) => console.error("Error fetching pages:", err));
  };

  const fetchConversations = (page) => {
    const accessToken = pageAccessTokens[page.id];
    setSelectedPage(page);
    fetch(
      `https://graph.facebook.com/${page.id}/conversations?fields=participants&access_token=${accessToken}`
    )
      .then((res) => res.json())
      .then((data) => {
        setConversations(data.data || []);
      })
      .catch((err) => console.error("Error fetching conversations:", err));
  };

  const fetchMessages = (conversation) => {
    const accessToken = pageAccessTokens[selectedPage.id];
    setSelectedConversation(conversation);
    fetch(
      `https://graph.facebook.com/${conversation.id}/messages?fields=message,from&access_token=${accessToken}`
    )
      .then((res) => res.json())
      .then((data) => {
        setMessages(data.data.reverse() || []); // show oldest first
      })
      .catch((err) => console.error("Error fetching messages:", err));
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    const accessToken = pageAccessTokens[selectedPage.id];
    fetch(
      `https://graph.facebook.com/${selectedConversation.id}/messages`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: newMessage,
          access_token: accessToken,
        }),
      }
    )
      .then((res) => res.json())
      .then((data) => {
        console.log("Message sent:", data);
        setNewMessage("");
        fetchMessages(selectedConversation);
      })
      .catch((err) => console.error("Error sending message:", err));
  };

  const cardStyle = {
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
    border: "none",
  };

  const listItemStyle = {
    background: "#fff",
    border: "1px solid #e1e3e5",
    borderRadius: "8px",
    padding: "12px",
    marginBottom: "12px",
    transition: "all 0.3s ease",
  };

  const listItemHover = {
    cursor: "pointer",
    background: "#f9fafb",
    transform: "scale(1.02)",
  };

  const messageStyle = (isOwn) => ({
    marginBottom: "10px",
    padding: "10px",
    borderRadius: "8px",
    maxWidth: "75%",
    alignSelf: isOwn ? "flex-end" : "flex-start",
    background: isOwn ? "#dcf8c6" : "#ffffff",
    border: "1px solid #ddd",
  });

  return (
    <Page title="💬 Facebook Chat Manager">
      <Card sectioned style={cardStyle}>
        {!isConnected ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <Button onClick={handleFacebookLogin} primary size="large">
              Connect with Facebook
            </Button>
          </div>
        ) : !selectedPage ? (
          <div>
            <Text variant="headingMd" as="h2" style={{ marginBottom: "20px" }}>
              Select a Page
            </Text>
            {pages.map((page) => (
              <div
                key={page.id}
                style={listItemStyle}
                onMouseOver={(e) =>
                  Object.assign(e.currentTarget.style, listItemHover)
                }
                onMouseOut={(e) =>
                  Object.assign(e.currentTarget.style, listItemStyle)
                }
              >
                <Text variant="bodyMd">{page.name}</Text>
                <Button
                  onClick={() => fetchConversations(page)}
                  primary
                  size="slim"
                  style={{ marginTop: "10px" }}
                >
                  View Conversations
                </Button>
              </div>
            ))}
          </div>
        ) : !selectedConversation ? (
          <div>
            <Button
              onClick={() => setSelectedPage(null)}
              plain
              style={{ marginBottom: "20px" }}
            >
              ⬅ Back to Pages
            </Button>
            <Text variant="headingMd" as="h2" style={{ marginBottom: "20px" }}>
              Conversations for {selectedPage.name}
            </Text>
            {conversations.map((conv) => (
              <div
                key={conv.id}
                style={listItemStyle}
                onMouseOver={(e) =>
                  Object.assign(e.currentTarget.style, listItemHover)
                }
                onMouseOut={(e) =>
                  Object.assign(e.currentTarget.style, listItemStyle)
                }
              >
                <Text variant="bodyMd">
                  Participants:{" "}
                  {conv.participants.data.map((p) => p.name).join(", ")}
                </Text>
                <Button
                  onClick={() => fetchMessages(conv)}
                  size="slim"
                  style={{ marginTop: "10px" }}
                >
                  View Chat
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <Button
              onClick={() => setSelectedConversation(null)}
              plain
              style={{ marginBottom: "20px" }}
            >
              ⬅ Back to Conversations
            </Button>
            <Text variant="headingMd" as="h2" style={{ marginBottom: "20px" }}>
              Chat with{" "}
              {selectedConversation.participants.data
                .map((p) => p.name)
                .join(", ")}
            </Text>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                maxHeight: "400px",
                overflowY: "auto",
                background: "#f6f8fa",
                padding: "15px",
                borderRadius: "8px",
                border: "1px solid #e1e4e8",
                marginBottom: "20px",
              }}
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  style={messageStyle(
                    msg.from?.name === selectedPage.name
                  )}
                >
                  <strong>{msg.from?.name || "Anonymous"}:</strong>{" "}
                  {msg.message}
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <TextField
                value={newMessage}
                onChange={setNewMessage}
                placeholder="Type your message..."
              />
              <Button onClick={sendMessage} primary>
                Send
              </Button>
            </div>
          </div>
        )}
      </Card>
    </Page>
  );
}
