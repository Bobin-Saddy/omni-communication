import { useState, useEffect } from "react";
import { Page, Card, Button, Text, Badge } from "@shopify/polaris";

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
          "pages_show_list,pages_read_engagement,pages_manage_metadata,pages_messaging,pages_manage_posts,instagram_basic,instagram_manage_messages",
      }
    );
  };

  const fetchPages = (userAccessToken) => {
    fetch(`https://graph.facebook.com/me/accounts?access_token=${userAccessToken}`)
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
    setSelectedConversation(null);

    fetch(
      `https://graph.facebook.com/${page.id}/conversations?platform=instagram&fields=participants&access_token=${accessToken}`
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
      .catch((err) => console.error("Error fetching conversations:", err));
  };

  const fetchMessages = (conversation) => {
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
        if (data.data) setMessages(data.data.reverse());
        setNewMessages((prev) => ({ ...prev, [conversation.id]: false }));
      })
      .catch((err) => console.error("Error fetching messages:", err));
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    if (!recipientId) {
      console.error("Recipient ID not found. Cannot send message.");
      return;
    }

    const accessToken = pageAccessTokens[selectedPage.id];

    const body = {
      messaging_type: "RESPONSE",
      recipient: { id: recipientId },
      message: { text: newMessage },
      access_token: accessToken,
    };

    fetch(`https://graph.facebook.com/v18.0/me/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
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
      .catch((err) => console.error("Network error sending message:", err));
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedPage && conversations.length > 0) {
        conversations.forEach((conv) => {
          const accessToken = pageAccessTokens[selectedPage.id];
          fetch(
            `https://graph.facebook.com/${conv.id}/messages?fields=message,from,created_time&access_token=${accessToken}`
          )
            .then((res) => res.json())
            .then((data) => {
              if (data.data && data.data.length > 0) {
                const lastMsg = data.data[0];
                const isOwn = lastMsg.from?.name === selectedPage.name;

                if (!isOwn) {
                  if (
                    selectedConversation &&
                    selectedConversation.id === conv.id
                  ) {
                    fetchMessages(conv);
                  } else {
                    setNewMessages((prev) => ({ ...prev, [conv.id]: true }));
                  }
                }
              }
            })
            .catch((err) =>
              console.error("Error polling conversation messages:", err)
            );
        });
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [selectedPage, conversations, selectedConversation]);

  return (
    <Page title="Instagram Chat Manager">
      <Card sectioned>
        {!isConnected ? (
          <Button onClick={handleFacebookLogin} primary>
            Connect Facebook/Instagram
          </Button>
        ) : !selectedPage ? (
          <>
            <Text variant="headingMd">Select a Page</Text>
            {pages.map((page) => (
              <div key={page.id}>
                <Text>{page.name}</Text>
                <Button onClick={() => fetchConversations(page)}>
                  View IG Conversations
                </Button>
              </div>
            ))}
          </>
        ) : !selectedConversation ? (
          <>
            <Button onClick={() => setSelectedPage(null)} plain>
              ← Back to Pages
            </Button>
            <Text variant="headingMd">Conversations</Text>
            {conversations.map((conv) => (
              <div key={conv.id}>
                <Text>
                  Participants: {conv.participants.data.map((p) => p.name).join(", ")}
                </Text>
                {newMessages[conv.id] && <Badge status="critical">New</Badge>}
                <Button onClick={() => fetchMessages(conv)}>View Chat</Button>
              </div>
            ))}
          </>
        ) : (
          <>
            <Button onClick={() => setSelectedConversation(null)} plain>
              ← Back to Conversations
            </Button>
            <Text variant="headingMd">Messages</Text>
            <div style={{ maxHeight: 400, overflowY: "auto" }}>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    textAlign:
                      msg.from?.name === selectedPage.name ? "right" : "left",
                    background:
                      msg.from?.name === selectedPage.name ? "#d1e7dd" : "#fff",
                    padding: "8px 12px",
                    margin: "4px 0",
                    borderRadius: "10px",
                  }}
                >
                  <strong>{msg.from?.name || "User"}:</strong> {msg.message}
                  <div style={{ fontSize: 12, color: "#888" }}>
                    {new Date(msg.created_time).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
              <input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendMessage();
                }}
                placeholder="Type a reply..."
                style={{ flex: 1, padding: 10, borderRadius: 4 }}
              />
              <Button onClick={sendMessage} primary>
                Send
              </Button>
            </div>
          </>
        )}
      </Card>
    </Page>
  );
}
