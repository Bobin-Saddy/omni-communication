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
      d.getElementsByTagName(s)[0].parentNode.insertBefore(js, s);
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
          <Layout.Section oneThird>
            <Text variant="headingMd" as="h3" style={{ marginBottom: 12 }}>Connected Pages</Text>

            {[...fbPages, ...igPages].map((page) => (
              <Card key={page.id} sectioned>
                <Text>{page.name}</Text>
                <Button onClick={() => fetchConversations(page)} size="slim" style={{ marginTop: 10 }}>
                  Show Conversations
                </Button>
              </Card>
            ))}

            {selectedPage && conversations.length > 0 && (
              <>
                <Text variant="headingMd" as="h3" style={{ marginTop: 20 }}>Conversations</Text>
                {conversations.map((conv) => (
                  <Card key={conv.id} sectioned>
                    <Text>Participants: {conv.participants.data.map((p) => p.name).join(", ")}</Text>
                    {newMessages[conv.id] && <Badge status="critical">New</Badge>}
                    <Button onClick={() => fetchMessages(conv)} size="slim" style={{ marginTop: 10 }}>
                      View Chat
                    </Button>
                  </Card>
                ))}
              </>
            )}
          </Layout.Section>

          <Layout.Section>
            {selectedConversation && (
              <>
                <Text variant="headingMd" as="h3">Chat</Text>
                <div style={{
                  maxHeight: 400,
                  overflowY: "auto",
                  padding: 15,
                  marginBottom: 20,
                  background: "#f9fafb",
                  border: "1px solid #ddd",
                  borderRadius: 8,
                }}>
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      style={{
                        marginBottom: 10,
                        textAlign: msg.from?.name === selectedPage.name ? "right" : "left",
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
                        <small style={{ fontSize: 12 }}>{new Date(msg.created_time).toLocaleString()}</small>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type message"
                    style={{
                      flex: 1,
                      padding: 10,
                      border: "1px solid #ccc",
                      borderRadius: 5,
                    }}
                  />
                  <Button onClick={sendMessage} primary>Send</Button>
                </div>
              </>
            )}
          </Layout.Section>
        </Layout>
      </Card>
    </Page>
  );
}
