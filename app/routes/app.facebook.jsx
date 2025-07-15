import { useState, useEffect } from "react";
import {
  Page,
  Card,
  Button,
  Text,
  TextField,
  Avatar,
  Divider,
  Spinner,
} from "@shopify/polaris";

export default function FacebookPagesConversations() {
  const [isConnected, setIsConnected] = useState(false);
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [pageAccessTokens, setPageAccessTokens] = useState({});
  const [loading, setLoading] = useState(false);

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
          console.log("❌ Login cancelled or not authorized.");
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
    setLoading(true);
    fetch(
      `https://graph.facebook.com/${page.id}/conversations?fields=participants&access_token=${accessToken}`
    )
      .then((res) => res.json())
      .then((data) => {
        setConversations(data.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching conversations:", err);
        setLoading(false);
      });
  };

  const fetchMessages = (conversation) => {
    const accessToken = pageAccessTokens[selectedPage.id];
    setSelectedConversation(conversation);
    setLoading(true);
    fetch(
      `https://graph.facebook.com/${conversation.id}/messages?fields=message,from&access_token=${accessToken}`
    )
      .then((res) => res.json())
      .then((data) => {
        setMessages(data.data.reverse() || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching messages:", err);
        setLoading(false);
      });
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
        setNewMessage("");
        fetchMessages(selectedConversation);
      })
      .catch((err) => console.error("Error sending message:", err));
  };

  return (
    <Page title="Facebook Chat Manager">
      <Card sectioned>
        {!isConnected ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <Button onClick={handleFacebookLogin} primary>
              Connect with Facebook
            </Button>
          </div>
        ) : loading ? (
          <Spinner accessibilityLabel="Loading" size="large" />
        ) : !selectedPage ? (
          <div>
            <Text variant="headingMd" as="h2" style={{ marginBottom: "20px" }}>
              Select a Page
            </Text>
            {pages.map((page) => (
              <Card
                key={page.id}
                sectioned
                title={page.name}
                actions={[
                  {
                    content: "View Conversations",
                    onAction: () => fetchConversations(page),
                  },
                ]}
              />
            ))}
          </div>
        ) : !selectedConversation ? (
          <div>
            <Button onClick={() => setSelectedPage(null)} plain>
              ⬅ Back to Pages
            </Button>
            <Text variant="headingMd" as="h2" style={{ margin: "15px 0" }}>
              Conversations for {selectedPage.name}
            </Text>
            {conversations.length === 0 ? (
              <Text>No conversations found.</Text>
            ) : (
              conversations.map((conv) => (
                <Card
                  key={conv.id}
                  sectioned
                  title={conv.participants.data.map((p) => p.name).join(", ")}
                  actions={[
                    {
                      content: "View Chat",
                      onAction: () => fetchMessages(conv),
                    },
                  ]}
                />
              ))
            )}
          </div>
        ) : (
          <div>
            <Button onClick={() => setSelectedConversation(null)} plain>
              ⬅ Back to Conversations
            </Button>
            <Text variant="headingMd" as="h2" style={{ margin: "15px 0" }}>
              Chat
            </Text>
            <Divider />
            <div
              style={{
                maxHeight: "400px",
                overflowY: "auto",
                background: "#f8f9fa",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #ddd",
                margin: "15px 0",
              }}
            >
              {messages.length === 0 ? (
                <Text>No messages found.</Text>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      marginBottom: "8px",
                      padding: "8px",
                      background: "#fff",
                      borderRadius: "4px",
                      border: "1px solid #ddd",
                    }}
                  >
                    <strong>{msg.from?.name || "Anonymous"}:</strong>{" "}
                    {msg.message}
                  </div>
                ))
              )}
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <TextField
                value={newMessage}
                onChange={setNewMessage}
                placeholder="Type your message..."
                multiline
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
