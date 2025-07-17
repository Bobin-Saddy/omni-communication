import { useState, useEffect } from "react";
import { Page, Card, Button, Text, TextField } from "@shopify/polaris";

export default function FacebookPagesConversations() {
  const [isConnected, setIsConnected] = useState(false);
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [pageAccessTokens, setPageAccessTokens] = useState({});
  const [recipientId, setRecipientId] = useState(null);

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

    // Get recipientId (the user, not the page)
    const recipient = conversation.participants.data.find(
      (p) => p.name !== selectedPage.name
    );
    setRecipientId(recipient?.id || null);

    fetch(
      `https://graph.facebook.com/${conversation.id}/messages?fields=message,from&access_token=${accessToken}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setMessages(data.data.reverse());
      })
      .catch((err) => console.error("Error fetching messages:", err));
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    if (!recipientId) {
      console.error("Recipient ID not found.");
      return;
    }

    const accessToken = pageAccessTokens[selectedPage.id];

    fetch(
      `https://graph.facebook.com/v18.0/me/messages?access_token=${accessToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: { id: recipientId },
          message: { text: newMessage },
        }),
      }
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.message_id) {
          console.log("Message sent:", data);
          setNewMessage("");
          fetchMessages(selectedConversation);
        } else {
          console.error("Error sending message:", data);
        }
      })
      .catch((err) => console.error("Error sending message:", err));
  };

  // CSS Styles
  const cardStyle = {
    borderRadius: "14px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
    border: "none",
    background: "linear-gradient(145deg, #ffffff, #f4f6f8)",
    padding: "20px",
  };

  const listItemStyle = {
    background: "#fff",
    border: "1px solid #e1e3e5",
    borderRadius: "10px",
    padding: "15px",
    marginBottom: "15px",
    transition: "all 0.3s ease",
    boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
  };

  const messageContainerStyle = {
    maxHeight: "450px",
    overflowY: "auto",
    background: "#f0f2f5",
    padding: "15px",
    borderRadius: "10px",
    border: "1px solid #e1e3e5",
    marginBottom: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  };

  const messageBubble = (isOwn) => ({
    alignSelf: isOwn ? "flex-end" : "flex-start",
    background: isOwn ? "#d1e7dd" : "#fff",
    color: "#333",
    padding: "10px 14px",
    borderRadius: isOwn ? "18px 18px 0 18px" : "18px 18px 18px 0",
    maxWidth: "70%",
    boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
  });

  return (
    <Page title="💬 Facebook Chat Manager">
      <Card sectioned style={cardStyle}>
        {!isConnected ? (
          <div style={{ textAlign: "center", padding: "50px 0" }}>
            <Button onClick={handleFacebookLogin} primary size="large">
              Connect with Facebook
            </Button>
          </div>
        ) : !selectedPage ? (
          <div>
            <Text variant="headingMd" as="h2" style={{ marginBottom: "25px" }}>
              Select a Page
            </Text>
            {pages.map((page) => (
              <div
                key={page.id}
                style={{ ...listItemStyle, cursor: "pointer" }}
              >
                <Text variant="bodyMd" as="p" fontWeight="medium">
                  {page.name}
                </Text>
                <Button
                  onClick={() => fetchConversations(page)}
                  primary
                  size="slim"
                  style={{ marginTop: "12px" }}
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
            <Text variant="headingMd" as="h2" style={{ marginBottom: "25px" }}>
              Conversations for {selectedPage.name}
            </Text>
            {conversations.map((conv) => (
              <div
                key={conv.id}
                style={{ ...listItemStyle, cursor: "pointer" }}
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

            <div style={messageContainerStyle}>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  style={messageBubble(msg.from?.name === selectedPage.name)}
                >
                  <strong>{msg.from?.name || "Anonymous"}:</strong>{" "}
                  {msg.message}
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
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
