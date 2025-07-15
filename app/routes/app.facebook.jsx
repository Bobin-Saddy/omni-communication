import { useState, useEffect } from "react";
import { Page, Card, Button, Text, Avatar } from "@shopify/polaris";

export default function FacebookPageMessages() {
  const [isConnected, setIsConnected] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [pageAccessToken, setPageAccessToken] = useState(null);
  const [pageId, setPageId] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  const FACEBOOK_APP_ID = "544704651303656";

  // ✅ Initialize Facebook SDK
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

  // ✅ Handle Facebook login
  const handleFacebookLogin = () => {
    window.FB.login(
      (response) => {
        if (response.authResponse) {
          fetchPageDetails(response.authResponse.accessToken);
        } else {
          console.log("❌ User cancelled login or did not fully authorize.");
        }
      },
      {
        scope:
          "pages_show_list,pages_read_engagement,pages_manage_metadata,pages_messaging",
      }
    );
  };

  // ✅ Fetch page details after login
  const fetchPageDetails = (userAccessToken) => {
    fetch(`https://graph.facebook.com/me/accounts?access_token=${userAccessToken}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.data && data.data.length > 0) {
          const firstPage = data.data[0];
          setPageId(firstPage.id);
          setPageAccessToken(firstPage.access_token);
          setIsConnected(true);
          fetchPageConversations(firstPage.id, firstPage.access_token);
        } else {
          console.log("❌ No pages found for this user.");
        }
      })
      .catch((err) => console.error("Error fetching page details:", err));
  };

  // ✅ Fetch conversations with participants
  const fetchPageConversations = async (PAGE_ID, PAGE_ACCESS_TOKEN, nextURL = null) => {
    try {
      const url =
        nextURL ||
        `https://graph.facebook.com/v20.0/${PAGE_ID}/conversations?fields=participants&limit=100&access_token=${PAGE_ACCESS_TOKEN}`;
      const response = await fetch(url);
      const data = await response.json();

      setConversations((prev) => [...prev, ...(data.data || [])]);

      if (data.paging && data.paging.next) {
        await fetchPageConversations(PAGE_ID, PAGE_ACCESS_TOKEN, data.paging.next);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    }
  };

  // ✅ Fetch messages in a conversation
  const fetchMessages = async (conversationId) => {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v20.0/${conversationId}/messages?fields=message,from&access_token=${pageAccessToken}`
      );
      const data = await response.json();
      setMessages(data.data || []);
      setSelectedConversation(conversationId);

      // ✅ Get user profile from participants data
      const conv = conversations.find((c) => c.id === conversationId);
      if (conv && conv.participants && conv.participants.data) {
        const recipient = conv.participants.data.find((p) => p.id !== pageId);
        if (recipient) {
          setUserProfile({
            name: recipient.name,
            picture: null, // Profile picture not available via PSID
          });
        }
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  // ✅ Get recipient ID for sending messages
  const getRecipientId = (conversationId) => {
    const conv = conversations.find((c) => c.id === conversationId);
    if (!conv || !conv.participants || !conv.participants.data) return null;

    const recipient = conv.participants.data.find((p) => p.id !== pageId);
    return recipient?.id || null;
  };

  // ✅ Send reply message
  const sendMessage = async () => {
    if (!selectedConversation || !replyText.trim()) {
      alert("Select a conversation and enter a message.");
      return;
    }

    const recipientId = getRecipientId(selectedConversation);
    if (!recipientId) {
      alert("Recipient ID not found.");
      return;
    }

    try {
      const response = await fetch(
        `https://graph.facebook.com/v20.0/${pageId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipient: { id: recipientId },
            message: { text: replyText },
            access_token: pageAccessToken,
          }),
        }
      );

      const data = await response.json();
      console.log("✅ Message sent:", data);
      fetchMessages(selectedConversation);
      setReplyText("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // ✅ Render UI
  return (
    <Page title="Facebook Page Messages">
      <Card sectioned>
        {!isConnected ? (
          <div style={{ textAlign: "center" }}>
            <Button onClick={handleFacebookLogin} primary>
              Connect with Facebook
            </Button>
          </div>
        ) : conversations.length === 0 ? (
          <Text>No conversations found.</Text>
        ) : (
          <>
            <Text variant="headingMd" as="h2" style={{ marginBottom: "10px" }}>
              Conversations
            </Text>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              {conversations.map((conv) => {
                const participant = conv.participants?.data?.find(
                  (p) => p.id !== pageId
                );
                const participantName = participant?.name || "Unknown User";

                return (
                  <Button key={conv.id} onClick={() => fetchMessages(conv.id)}>
                    {participantName}
                  </Button>
                );
              })}
            </div>
          </>
        )}

        {selectedConversation && (
          <div style={{ marginTop: "30px" }}>
            {userProfile && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "20px",
                }}
              >
                <Avatar
                  customer
                  name={userProfile.name}
                  source={userProfile.picture}
                />
                <Text variant="headingMd" as="h2" style={{ marginLeft: "10px" }}>
                  {userProfile.name}
                </Text>
              </div>
            )}

            <Text variant="headingMd" as="h2" style={{ marginBottom: "10px" }}>
              Messages
            </Text>
            {messages.length === 0 ? (
              <Text>No messages found.</Text>
            ) : (
              <ul style={{ listStyle: "none", padding: "0" }}>
                {messages.map((msg) => (
                  <li
                    key={msg.id}
                    style={{
                      marginBottom: "8px",
                      padding: "10px",
                      background: "#f6f6f7",
                      borderRadius: "6px",
                    }}
                  >
                    <strong>{msg.from?.name || msg.from?.id || "Anonymous"}:</strong>{" "}
                    {msg.message}
                  </li>
                ))}
              </ul>
            )}

            <div style={{ marginTop: "20px", display: "flex", alignItems: "center" }}>
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your reply here..."
                style={{
                  flex: "1",
                  padding: "10px",
                  border: "1px solid #ccc",
                  borderRadius: "6px",
                  marginRight: "10px",
                }}
              />
              <Button onClick={sendMessage} primary>
                Send Reply
              </Button>
            </div>
          </div>
        )}
      </Card>
    </Page>
  );
}
