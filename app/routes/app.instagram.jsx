import { useState, useEffect } from "react";
import { Page, Card, Button, Text, Badge } from "@shopify/polaris";

export default function InstagramChatProcessor() {
  const [isConnected, setIsConnected] = useState(false);
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [pageAccessTokens, setPageAccessTokens] = useState({});
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
      var js,
        fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) return;
      js = d.createElement(s);
      js.id = id;
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      fjs.parentNode.insertBefore(js, fjs);
    })(document, "script", "facebook-jssdk");
  }, []);

  const handleInstagramLogin = () => {
    window.FB.login(
      (response) => {
        if (response.authResponse) {
          fetchInstagramPages(response.authResponse.accessToken);
        } else {
          console.log("User cancelled login or did not fully authorize.");
        }
      },
      {
        scope:
          "pages_show_list,instagram_basic,instagram_manage_messages,pages_read_engagement,pages_manage_metadata",
      }
    );
  };

const fetchInstagramPages = (userAccessToken) => {
  fetch(
    `https://graph.facebook.com/me/accounts?fields=instagram_business_account,access_token,name&access_token=${userAccessToken}`
  )
    .then((res) => res.json())
    .then((data) => {
      const pagesWithInstagram = data.data.filter(
        (page) => page.instagram_business_account
      );
      const tokens = {};
      pagesWithInstagram.forEach((page) => {
        tokens[page.id] = page.access_token; // Map page.id
      });
      setPageAccessTokens(tokens);
      setPages(pagesWithInstagram);
      setIsConnected(true);
    })
    .catch((err) => console.error("Error fetching Instagram pages:", err));
};


  const fetchConversations = (page) => {
    const igId = page.instagram_business_account.id;
    const accessToken = pageAccessTokens[igId];
    setSelectedPage(page);
    setSelectedConversation(null);

    fetch(
      `https://graph.facebook.com/v18.0/${igId}/conversations?platform=instagram&access_token=${accessToken}`
    )
      .then((res) => res.json())
      .then((data) => {
        setConversations(data.data || []);
        const newMsgs = {};
        data.data.forEach((conv) => {
          newMsgs[conv.id] = false;
        });
        setNewMessages(newMsgs);
      })
      .catch((err) => console.error("Error fetching IG conversations:", err));
  };

  const fetchMessages = (conversation) => {
    const igId = selectedPage.instagram_business_account.id;
    const accessToken = pageAccessTokens[igId];
    setSelectedConversation(conversation);
       const recipient = conversation.participants.data.find(
      (p) => p.name !== selectedPage.name
    );
    setRecipientId(recipient?.id || null);


    fetch(
      `https://graph.facebook.com/v18.0/${conversation.id}/messages?fields=message,from,created_time&access_token=${accessToken}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setMessages(data.data.reverse());
        setNewMessages((prev) => ({ ...prev, [conversation.id]: false }));
      })
      .catch((err) => console.error("Error fetching IG messages:", err));
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;
   if (!recipientId) {
      console.error("Recipient ID not found.");
      return;
    }
    const igId = selectedPage.instagram_business_account.id;
    const accessToken = pageAccessTokens[igId];

    fetch(
      `https://graph.facebook.com/v18.0/${igId}/messages?access_token=${accessToken}`,
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
        if (data.id) {
          console.log("IG Message sent:", data);
          setNewMessage("");
          fetchMessages(selectedConversation);
        } else {
          console.error("Error sending IG message:", data);
        }
      })
      .catch((err) => console.error("Error sending IG message:", err));
  };

  return (
    <Page title="💬 Instagram Chat Processor">
      <Card sectioned>
        {!isConnected ? (
          <div style={{ textAlign: "center", padding: "50px 0" }}>
            <Button onClick={handleInstagramLogin} primary size="large">
              Connect with Instagram
            </Button>
          </div>
        ) : !selectedPage ? (
          <div>
            <Text variant="headingMd" as="h2" style={{ marginBottom: "25px" }}>
              Select an Instagram Account
            </Text>
            {pages.map((page) => (
              <div
                key={page.id}
                style={{ padding: "15px", borderBottom: "1px solid #eee" }}
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
              onClick={() => {
                setSelectedPage(null);
                setConversations([]);
              }}
              plain
              style={{ marginBottom: "20px" }}
            >
              ⬅ Back to Accounts
            </Button>
            <Text variant="headingMd" as="h2" style={{ marginBottom: "25px" }}>
              Conversations
            </Text>
            {conversations.map((conv) => (
              <div
                key={conv.id}
                style={{ padding: "15px", borderBottom: "1px solid #eee" }}
              >
                <Text variant="bodyMd">
                  Conversation ID: {conv.id}
                </Text>
                {newMessages[conv.id] && (
                  <Badge status="critical" style={{ marginLeft: "10px" }}>
                    🔴 New Message
                  </Badge>
                )}
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
          <div>
            <Button
              onClick={() => setSelectedConversation(null)}
              plain
              style={{ marginBottom: "20px" }}
            >
              ⬅ Back to Conversations
            </Button>
            <Text variant="headingMd" as="h2" style={{ marginBottom: "20px" }}>
              Chat
            </Text>

            <div
              style={{
                maxHeight: "450px",
                overflowY: "auto",
                background: "#f4f6f8",
                padding: "15px",
                borderRadius: "10px",
                border: "1px solid #e1e3e5",
                marginBottom: "20px",
              }}
            >
              {messages.map((msg) => (
                <div key={msg.id} style={{ marginBottom: "10px" }}>
                  <strong>{msg.from?.username || "User"}:</strong> {msg.message}
                  <div style={{ fontSize: "12px", color: "#666" }}>
                    {new Date(msg.created_time).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: "12px", width: "100%" }}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  border: "1px solid #dfe3e8",
                  borderRadius: "6px",
                  fontSize: "14px",
                }}
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
