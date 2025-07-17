import { useState, useEffect } from "react";
import { Page, Card, Button, Text } from "@shopify/polaris";

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
  const [unreadCounts, setUnreadCounts] = useState({});

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
      var js, fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) return;
      js = d.createElement(s);
      js.id = id;
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      fjs.parentNode.insertBefore(js, fjs);
    })(document, "script", "facebook-jssdk");
  }, []);

  const fetchUnreadCounts = () => {
    fetch("/api/unread-counts")
      .then((res) => res.json())
      .then((data) => setUnreadCounts(data))
      .catch((err) => console.error("Error fetching unread counts:", err));
  };

  useEffect(() => {
    const interval = setInterval(fetchUnreadCounts, 2000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = (conversationId) => {
    fetch("/api/mark-read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId }),
    })
      .then(() => {
        setUnreadCounts((prev) => ({ ...prev, [conversationId]: 0 }));
      })
      .catch((err) => console.error("Error marking as read:", err));
  };

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
        markAsRead(conversation.id);
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
        } else {
          console.error("Error sending message:", data);
        }
      })
      .catch((err) => console.error("Error sending message:", err));
  };

  return (
    <Page title="💬 Facebook Chat Manager">
      <Card sectioned>
        {!isConnected ? (
          <Button onClick={handleFacebookLogin} primary>
            Connect with Facebook
          </Button>
        ) : !selectedPage ? (
          <div>
            <Text variant="headingMd" as="h2">
              Select a Page
            </Text>
            {pages.map((page) => (
              <div key={page.id}>
                <Text>{page.name}</Text>
                <Button onClick={() => fetchConversations(page)}>
                  View Conversations
                </Button>
              </div>
            ))}
          </div>
        ) : !selectedConversation ? (
          <div>
            <Button onClick={() => setSelectedPage(null)} plain>
              ⬅ Back to Pages
            </Button>
            <Text variant="headingMd" as="h2">
              Conversations for {selectedPage.name}
            </Text>
            {conversations.map((conv) => (
              <div
                key={conv.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: "1px solid #eee",
                  padding: "10px 0",
                }}
              >
                <div>
                  <Text>
                    Participants:{" "}
                    {conv.participants.data.map((p) => p.name).join(", ")}
                  </Text>
                  <Button onClick={() => fetchMessages(conv)} size="slim">
                    View Chat
                  </Button>
                </div>

                {unreadCounts[conv.id] > 0 && (
                  <div
                    style={{
                      background: "#d72c0d",
                      color: "white",
                      borderRadius: "12px",
                      padding: "4px 10px",
                      fontSize: "12px",
                    }}
                  >
                    New {unreadCounts[conv.id]} message
                    {unreadCounts[conv.id] > 1 ? "s" : ""}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div>
            <Button onClick={() => setSelectedConversation(null)} plain>
              ⬅ Back to Conversations
            </Button>
            <Text variant="headingMd" as="h2">
              Chat
            </Text>
            <div style={{ maxHeight: "400px", overflowY: "auto" }}>
              {messages.map((msg) => (
                <div key={msg.id}>
                  <strong>{msg.from?.name}</strong>: {msg.message}
                </div>
              ))}
            </div>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
            />
            <Button onClick={sendMessage} primary>
              Send
            </Button>
          </div>
        )}
      </Card>
    </Page>
  );
}
