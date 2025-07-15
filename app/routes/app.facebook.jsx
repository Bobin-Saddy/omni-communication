import { useState, useEffect } from "react";
import { Page, Card, Button, Text, Avatar } from "@shopify/polaris";

export default function FacebookPagesConversations() {
  const [isConnected, setIsConnected] = useState(false);
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [conversationPaging, setConversationPaging] = useState({});
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);

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

  // ✅ Facebook login handler
  const handleFacebookLogin = () => {
    window.FB.login(
      (response) => {
        if (response.authResponse) {
          fetchPages(response.authResponse.accessToken);
        } else {
          alert("Login cancelled or not authorized.");
        }
      },
      {
        scope:
          "pages_show_list,pages_read_engagement,pages_manage_metadata,pages_messaging",
      }
    );
  };

  // ✅ Fetch user's pages
  const fetchPages = (accessToken) => {
    fetch(`https://graph.facebook.com/me/accounts?access_token=${accessToken}`)
      .then((res) => res.json())
      .then((data) => {
        setPages(data.data || []);
        setIsConnected(true);
      })
      .catch((err) => console.error("Error fetching pages:", err));
  };

  // ✅ Fetch conversations of a page
  const fetchPageConversations = (page, url = null) => {
    const fetchUrl =
      url ||
      `https://graph.facebook.com/v20.0/${page.id}/conversations?fields=participants&limit=5&access_token=${page.access_token}`;

    fetch(fetchUrl)
      .then((res) => res.json())
      .then((data) => {
        setSelectedPage(page);
        setConversations(data.data || []);
        setConversationPaging(data.paging || {});
        setSelectedConversation(null);
        setMessages([]);
      })
      .catch((err) => console.error("Error fetching conversations:", err));
  };

  // ✅ Fetch messages of a conversation
  const fetchConversationMessages = (convId) => {
    fetch(
      `https://graph.facebook.com/v20.0/${convId}/messages?fields=message,from&access_token=${selectedPage.access_token}`
    )
      .then((res) => res.json())
      .then((data) => {
        setSelectedConversation(convId);
        setMessages(data.data || []);
      })
      .catch((err) => console.error("Error fetching messages:", err));
  };

  return (
    <Page title="Facebook Pages Conversations">
      <Card sectioned>
        {!isConnected ? (
          <div style={{ textAlign: "center" }}>
            <Button onClick={handleFacebookLogin} primary>
              Connect with Facebook
            </Button>
          </div>
        ) : (
          <>
            <Text variant="headingMd" as="h2" style={{ marginBottom: "10px" }}>
              Your Pages
            </Text>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "10px",
                marginBottom: "20px",
              }}
            >
              {pages.map((page) => (
                <Button
                  key={page.id}
                  onClick={() => fetchPageConversations(page)}
                >
                  {page.name}
                </Button>
              ))}
            </div>
          </>
        )}

        {selectedPage && (
          <div style={{ marginTop: "30px" }}>
            <Text variant="headingMd" as="h2" style={{ marginBottom: "15px" }}>
              Conversations for {selectedPage.name}
            </Text>

            {conversations.length === 0 ? (
              <Text>No conversations found.</Text>
            ) : (
              <ul style={{ listStyle: "none", padding: "0" }}>
                {conversations.map((conv) => (
                  <li
                    key={conv.id}
                    style={{
                      background: "#f9f9f9",
                      border: "1px solid #ddd",
                      borderRadius: "6px",
                      padding: "10px",
                      marginBottom: "10px",
                    }}
                  >
                    <Text variant="bodyMd">
                      Conversation ID: <strong>{conv.id}</strong>
                    </Text>
                    <div style={{ marginTop: "8px" }}>
                      <Text variant="bodyMd">Participants:</Text>
                      {conv.participants.data.map((p) => (
                        <div
                          key={p.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            marginTop: "5px",
                          }}
                        >
                          <Avatar customer name={p.name} />
                          <span style={{ marginLeft: "10px" }}>
                            {p.name || p.id}
                          </span>
                        </div>
                      ))}
                    </div>
                    <Button
                      onClick={() => fetchConversationMessages(conv.id)}
                      plain
                      size="slim"
                      style={{ marginTop: "10px" }}
                    >
                      View Messages
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            {/* ✅ Pagination Buttons */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: "20px",
              }}
            >
              <Button
                onClick={() =>
                  conversationPaging.previous &&
                  fetchPageConversations(selectedPage, conversationPaging.previous)
                }
                disabled={!conversationPaging.previous}
              >
                ← Previous
              </Button>
              <Button
                onClick={() =>
                  conversationPaging.next &&
                  fetchPageConversations(selectedPage, conversationPaging.next)
                }
                disabled={!conversationPaging.next}
              >
                Next →
              </Button>
            </div>

            {selectedConversation && (
              <div style={{ marginTop: "30px" }}>
                <Text variant="headingMd" as="h2" style={{ marginBottom: "15px" }}>
                  Messages for Conversation {selectedConversation.slice(-4)}
                </Text>

                {messages.length === 0 ? (
                  <Text>No messages found.</Text>
                ) : (
                  <ul style={{ listStyle: "none", padding: "0" }}>
                    {messages.map((msg) => (
                      <li
                        key={msg.id}
                        style={{
                          background: "#eef1f5",
                          padding: "10px",
                          borderRadius: "6px",
                          marginBottom: "8px",
                        }}
                      >
                        <strong>{msg.from?.name || "Anonymous"}:</strong>{" "}
                        {msg.message}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
      </Card>
    </Page>
  );
}
