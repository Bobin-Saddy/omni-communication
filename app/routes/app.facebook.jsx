import { useState, useEffect } from "react";
import { Page, Card, Button, Text, Avatar, Icon } from "@shopify/polaris";
import { ChevronLeftMinor, ChevronRightMinor } from "@shopify/polaris-icons";

export default function FacebookPagesConversations() {
  const [isConnected, setIsConnected] = useState(false);
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [userProfile, setUserProfile] = useState(null);
  const [conversationPaging, setConversationPaging] = useState({ next: null, previous: null });

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

  const handleFacebookLogin = () => {
    window.FB.login(
      (response) => {
        if (response.authResponse) {
          fetchPages(response.authResponse.accessToken);
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

  const fetchPages = (userAccessToken) => {
    fetch(`https://graph.facebook.com/me/accounts?access_token=${userAccessToken}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.data && data.data.length > 0) {
          setPages(data.data);
          setIsConnected(true);
        } else {
          console.log("❌ No pages found for this user.");
        }
      })
      .catch((err) => console.error("Error fetching pages:", err));
  };

  const fetchPageConversations = async (page, url = null) => {
    setSelectedPage(page);
    setMessages([]);
    setSelectedConversation(null);
    setUserProfile(null);

    try {
      const apiUrl =
        url ||
        `https://graph.facebook.com/v20.0/${page.id}/conversations?fields=participants&limit=5&access_token=${page.access_token}`;
      const response = await fetch(apiUrl);
      const data = await response.json();
      setConversations(data.data || []);
      setConversationPaging({
        next: data.paging?.next || null,
        previous: data.paging?.previous || null,
      });
    } catch (error) {
      console.error("Error fetching conversations:", error);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v20.0/${conversationId}/messages?fields=message,from&access_token=${selectedPage.access_token}`
      );
      const data = await response.json();
      setMessages(data.data || []);
      setSelectedConversation(conversationId);

      const conv = conversations.find((c) => c.id === conversationId);
      if (conv && conv.participants && conv.participants.data) {
        const recipient = conv.participants.data.find((p) => p.id !== selectedPage.id);
        if (recipient) {
          setUserProfile({
            name: recipient.name,
            picture: null,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const sendMessage = async () => {
    if (!selectedConversation || !replyText.trim()) {
      alert("Select a conversation and enter a message.");
      return;
    }

    const conv = conversations.find((c) => c.id === selectedConversation);
    const recipient = conv?.participants?.data?.find((p) => p.id !== selectedPage.id);

    if (!recipient) {
      alert("Recipient not found.");
      return;
    }

    try {
      const response = await fetch(
        `https://graph.facebook.com/v20.0/${selectedPage.id}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipient: { id: recipient.id },
            message: { text: replyText },
            access_token: selectedPage.access_token,
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

  return (
    <Page title="Facebook Pages & Conversations">
      <Card sectioned>
        {!isConnected ? (
          <div style={{ textAlign: "center" }}>
            <Button onClick={handleFacebookLogin} primary>
              Connect with Facebook
            </Button>
          </div>
        ) : pages.length === 0 ? (
          <Text>No pages found.</Text>
        ) : (
          <>
            <Text variant="headingMd" as="h2" style={{ marginBottom: "10px" }}>
              Your Pages
            </Text>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "20px" }}>
              {pages.map((page) => (
                <Button key={page.id} onClick={() => fetchPageConversations(page)}>
                  {page.name}
                </Button>
              ))}
            </div>

            {selectedPage && (
              <>
                <Text variant="headingMd" as="h2" style={{ marginBottom: "10px" }}>
                  Conversations for {selectedPage.name}
                </Text>
                {conversations.length === 0 ? (
                  <Text>No conversations found.</Text>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {conversations.map((conv) => {
                      const participant = conv.participants?.data?.find(
                        (p) => p.id !== selectedPage.id
                      );
                      const participantName = participant?.name || "Unknown User";

                      return (
                        <Button
                          key={conv.id}
                          onClick={() => fetchMessages(conv.id)}
                          style={{
                            justifyContent: "flex-start",
                            padding: "10px",
                            borderRadius: "8px",
                            border: "1px solid #ddd",
                            background: "#f9fafb",
                          }}
                        >
                          👤 {participantName}
                        </Button>
                      );
                    })}
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px" }}>
                  <Button
                    icon={ChevronLeftMinor}
                    onClick={() =>
                      conversationPaging.previous &&
                      fetchPageConversations(selectedPage, conversationPaging.previous)
                    }
                    disabled={!conversationPaging.previous}
                  >
                    Previous
                  </Button>
                  <Button
                    icon={ChevronRightMinor}
                    onClick={() =>
                      conversationPaging.next &&
                      fetchPageConversations(selectedPage, conversationPaging.next)
                    }
                    disabled={!conversationPaging.next}
                  >
                    Next
                  </Button>
                </div>
              </>
            )}
          </>
        )}

        {selectedConversation && (
          <div style={{ marginTop: "30px" }}>
            {userProfile && (
              <div style={{ display: "flex", alignItems: "center", marginBottom: "20px" }}>
                <Avatar customer name={userProfile.name} source={userProfile.picture} />
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
                      background: "#f0f4f8",
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
