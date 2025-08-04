import { useState, useEffect } from "react";
import { Page, Card, Button, Text, Badge, Layout } from "@shopify/polaris";

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

    const firstScript = d.getElementsByTagName(s)[0];
    if (firstScript && firstScript.parentNode) {
      firstScript.parentNode.insertBefore(js, firstScript);
    } else {
      d.head.appendChild(js);
    }
  })(document, "script", "facebook-jssdk");
}, []);

  const handleFacebookLogin = () => {
    window.FB.login(
      (response) => {
        if (response.authResponse) {
          fetchPages(response.authResponse.accessToken, "facebook");
        }
      },
      {
        scope:
          "pages_show_list,pages_read_engagement,pages_manage_metadata,pages_messaging,pages_manage_posts,instagram_basic,instagram_manage_messages",
      }
    );
  };

  const handleInstagramLogin = () => {
    window.FB.login(
      (response) => {
        if (response.authResponse) {
          fetchPages(response.authResponse.accessToken, "instagram");
        }
      },
      {
        scope: "instagram_basic,instagram_manage_messages,pages_show_list",
      }
    );
  };

  const fetchPages = (userAccessToken, type) => {
    fetch(`https://graph.facebook.com/me/accounts?access_token=${userAccessToken}`)
      .then((res) => res.json())
      .then((data) => {
        const tokens = {};
        const pages = [];

        data.data.forEach((page) => {
          tokens[page.id] = page.access_token;
          pages.push(page);
        });

        setPageAccessTokens((prev) => ({ ...prev, ...tokens }));

        if (type === "facebook") {
          setFbPages(pages);
          setFbConnected(true);
        } else {
          setIgPages(pages);
          setIgConnected(true);
        }
      });
  };

  const fetchConversations = (page) => {
    const accessToken = pageAccessTokens[page.id];
    setSelectedPage(page);
    setSelectedConversation(null);

    fetch(`https://graph.facebook.com/${page.id}/conversations?fields=participants&access_token=${accessToken}`)
      .then((res) => res.json())
      .then((data) => {
        setConversations(data.data || []);
        const newMsgs = {};
        data.data?.forEach((conv) => (newMsgs[conv.id] = false));
        setNewMessages(newMsgs);
      });
  };

  const fetchMessages = (conversation) => {
    const accessToken = pageAccessTokens[selectedPage.id];
    setSelectedConversation(conversation);
    const recipient = conversation.participants.data.find((p) => p.name !== selectedPage.name);
    setRecipientId(recipient?.id || null);

    fetch(`https://graph.facebook.com/${conversation.id}/messages?fields=message,from,created_time&access_token=${accessToken}`)
      .then((res) => res.json())
      .then((data) => {
        setMessages(data.data?.reverse() || []);
        setNewMessages((prev) => ({ ...prev, [conversation.id]: false }));
      });
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !recipientId) return;

    const accessToken = pageAccessTokens[selectedPage.id];
    fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${accessToken}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text: newMessage },
        messaging_type: "MESSAGE_TAG",
        tag: "ACCOUNT_UPDATE",
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.message_id) {
          setNewMessage("");
          fetchMessages(selectedConversation);
        }
      });
  };

  return (
    <Page title="📱 Facebook & Instagram Chat">
      <Card sectioned>
        {!fbConnected && !igConnected && (
          <div style={{ textAlign: "center", marginBottom: "30px" }}>
            <Button onClick={handleFacebookLogin} primary>Connect Facebook</Button>
            <Button onClick={handleInstagramLogin} style={{ marginLeft: 10 }}>Connect Instagram</Button>
          </div>
        )}

<Layout>
  <Layout.Section>
    <div style={{ display: "flex", height: "600px", border: "1px solid #ccc", borderRadius: 8, overflow: "hidden" }}>
      {/* Left Sidebar */}
      <div style={{ width: "30%", borderRight: "1px solid #eee", overflowY: "auto", background: "#fafafa" }}>
        <div style={{ padding: 12, borderBottom: "1px solid #ddd" }}>
          <Text variant="headingMd">Conversations</Text>
        </div>
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
                padding: "12px 16px",
                borderBottom: "1px solid #eee",
                backgroundColor: selectedConversation?.id === conv.id ? "#e7f1ff" : "transparent",
                cursor: "pointer",
              }}
            >
              <Text variant="bodyMd"><strong>{participantNames}</strong></Text>
              {newMessages[conv.id] && <Badge status="critical">New</Badge>}
            </div>
          );
        })}
      </div>

      {/* Right Chat Window */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: 12, borderBottom: "1px solid #ddd", background: "#fff" }}>
          <Text variant="headingMd">Chat</Text>
        </div>
        <div style={{ flex: 1, padding: 15, overflowY: "auto", background: "#f5f5f5" }}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                textAlign: msg.from?.name === selectedPage.name ? "right" : "left",
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  display: "inline-block",
                  padding: "10px 15px",
                  borderRadius: 10,
                  backgroundColor: msg.from?.name === selectedPage.name ? "#d1e7dd" : "#fff",
                  border: "1px solid #ccc",
                }}
              >
                <strong>{msg.from?.name}</strong>
                <div>{msg.message}</div>
                <small style={{ fontSize: 12 }}>
                  {new Date(msg.created_time).toLocaleString()}
                </small>
              </div>
            </div>
          ))}
        </div>

        {/* Input Section */}
        <div style={{ display: "flex", padding: 12, borderTop: "1px solid #ddd", background: "#fff" }}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message"
            style={{
              flex: 1,
              padding: 10,
              border: "1px solid #ccc",
              borderRadius: 5,
            }}
          />
          <Button onClick={sendMessage} primary style={{ marginLeft: 10 }}>
            Send
          </Button>
        </div>
      </div>
    </div>
  </Layout.Section>
</Layout>

      </Card>
    </Page>
  );
}
