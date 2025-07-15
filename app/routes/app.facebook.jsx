import { useState, useEffect } from "react";
import { Page, Card, Button, Text, Avatar } from "@shopify/polaris";

export default function FacebookPagesConversations() {
  const [isConnected, setIsConnected] = useState(false);
  const [pages, setPages] = useState([]);
  const [selectedPageId, setSelectedPageId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [pageAccessToken, setPageAccessToken] = useState(null);

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
          console.log("✅ Facebook login successful:", response);
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
    fetch(
      `https://graph.facebook.com/me/accounts?access_token=${userAccessToken}`
    )
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

  const fetchConversations = (pageId, accessToken) => {
    setSelectedPageId(pageId);
    setPageAccessToken(accessToken);
    fetch(
      `https://graph.facebook.com/v20.0/${pageId}/conversations?fields=participants&limit=100&access_token=${accessToken}`
    )
      .then((res) => res.json())
      .then((data) => {
        setConversations(data.data || []);
        setSelectedConversation(null);
        setMessages([]);
      })
      .catch((err) => console.error("Error fetching conversations:", err));
  };

  const fetchConversationMessages = (conversationId) => {
    setSelectedConversation(conversationId);
    fetch(
      `https://graph.facebook.com/v20.0/${conversationId}/messages?fields=message,from&access_token=${pageAccessToken}`
    )
      .then((res) => res.json())
      .then((data) => {
        setMessages(data.data || []);
      })
      .catch((err) => console.error("Error fetching messages:", err));
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
          <div>
            <Text variant="headingMd" as="h2" style={{ marginBottom: "15px" }}>
              Your Facebook Pages
            </Text>
            <ul style={{ listStyle: "none", padding: "0" }}>
              {pages.map((page) => (
                <li
                  key={page.id}
                  style={{
                    background: "#f9f9f9",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                    padding: "10px",
                    marginBottom: "10px",
                  }}
                >
                  <Text variant="bodyMd">
                    Page: <strong>{page.name}</strong>
                  </Text>
                  <Button
                    onClick={() =>
                      fetchConversations(page.id, page.access_token)
                    }
                    plain
                    size="slim"
                    style={{ marginTop: "10px" }}
                  >
                    View Conversations
                  </Button>
                </li>
              ))}
            </ul>

            {selectedPageId && (
              <div style={{ marginTop: "30px" }}>
                <Text
                  variant="headingMd"
                  as="h2"
                  style={{ marginBottom: "15px" }}
                >
                  Conversations for Page ID: {selectedPageId}
                </Text>
                {conversations.length === 0 ? (
                  <Text>No conversations found.</Text>
                ) : (
                  <ul style={{ listStyle: "none", padding: "0" }}>
                    {conversations.map((conv) => (
                      <li
                        key={conv.id}
                        style={{
                          background: "#f6f6f7",
                          border: "1px solid #ccc",
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

                        {selectedConversation === conv.id && (
                          <div
                            style={{
                              marginTop: "15px",
                              background: "#eef1f5",
                              padding: "10px",
                              borderRadius: "6px",
                            }}
                          >
                            <Text
                              variant="headingSm"
                              as="h3"
                              style={{ marginBottom: "10px" }}
                            >
                              Messages
                            </Text>
                            {messages.length === 0 ? (
                              <Text>No messages found.</Text>
                            ) : (
                              <ul
                                style={{
                                  listStyle: "none",
                                  padding: "0",
                                  maxHeight: "300px",
                                  overflowY: "auto",
                                }}
                              >
                                {messages.map((msg) => (
                                  <li
                                    key={msg.id}
                                    style={{
                                      marginBottom: "8px",
                                      padding: "8px",
                                      background: "#fff",
                                      borderRadius: "4px",
                                      border: "1px solid #ddd",
                                    }}
                                  >
                                    <strong>
                                      {msg.from?.name || "Anonymous"}:
                                    </strong>{" "}
                                    {msg.message}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}
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
