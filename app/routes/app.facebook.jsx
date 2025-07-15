import { useState, useEffect } from "react";
import { Page, Card, Button, Text, Avatar } from "@shopify/polaris";

export default function FacebookPagesConversations() {
  const [isConnected, setIsConnected] = useState(false);
  const [pages, setPages] = useState([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [selectedPageId, setSelectedPageId] = useState(null);
  const [conversationsByPage, setConversationsByPage] = useState({});
  const [messagesByConversation, setMessagesByConversation] = useState({});
  const [pageAccessTokens, setPageAccessTokens] = useState({});

  const FACEBOOK_APP_ID = "544704651303656";
  const PAGES_PER_VIEW = 5;

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
          const tokens = {};
          data.data.forEach((page) => {
            tokens[page.id] = page.access_token;
          });
          setPageAccessTokens(tokens);
          setPages(data.data);
          setIsConnected(true);
        } else {
          console.log("❌ No pages found for this user.");
        }
      })
      .catch((err) => console.error("Error fetching pages:", err));
  };

  const fetchConversations = (pageId) => {
    const accessToken = pageAccessTokens[pageId];
    setSelectedPageId(pageId);
    fetch(
      `https://graph.facebook.com/v20.0/${pageId}/conversations?fields=participants&limit=100&access_token=${accessToken}`
    )
      .then((res) => res.json())
      .then((data) => {
        setConversationsByPage((prev) => ({
          ...prev,
          [pageId]: data.data || [],
        }));
      })
      .catch((err) => console.error("Error fetching conversations:", err));
  };

  const fetchConversationMessages = (pageId, conversationId) => {
    const accessToken = pageAccessTokens[pageId];
    fetch(
      `https://graph.facebook.com/v20.0/${conversationId}/messages?fields=message,from&access_token=${accessToken}`
    )
      .then((res) => res.json())
      .then((data) => {
        setMessagesByConversation((prev) => ({
          ...prev,
          [conversationId]: data.data || [],
        }));
      })
      .catch((err) => console.error("Error fetching messages:", err));
  };

  const startIndex = currentPageIndex * PAGES_PER_VIEW;
  const paginatedPages = pages.slice(startIndex, startIndex + PAGES_PER_VIEW);

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
              {paginatedPages.map((page) => (
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
                    onClick={() => fetchConversations(page.id)}
                    plain
                    size="slim"
                    style={{ marginTop: "10px" }}
                  >
                    View Conversations
                  </Button>

                  {conversationsByPage[page.id] && (
                    <div style={{ marginTop: "20px" }}>
                      <Text
                        variant="headingMd"
                        as="h3"
                        style={{ marginBottom: "10px" }}
                      >
                        Conversations
                      </Text>
                      <ul style={{ listStyle: "none", padding: "0" }}>
                        {conversationsByPage[page.id].map((conv) => (
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
                              onClick={() =>
                                fetchConversationMessages(page.id, conv.id)
                              }
                              plain
                              size="slim"
                              style={{ marginTop: "10px" }}
                            >
                              View Messages
                            </Button>

                            {messagesByConversation[conv.id] && (
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
                                  as="h4"
                                  style={{ marginBottom: "10px" }}
                                >
                                  Messages
                                </Text>
                                {messagesByConversation[conv.id].length ===
                                0 ? (
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
                                    {messagesByConversation[conv.id].map(
                                      (msg) => (
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
                                      )
                                    )}
                                  </ul>
                                )}
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              ))}
            </ul>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: "20px",
              }}
            >
              <Button
                onClick={() =>
                  setCurrentPageIndex((prev) => Math.max(prev - 1, 0))
                }
                disabled={currentPageIndex === 0}
              >
                Previous
              </Button>
              <Button
                onClick={() =>
                  setCurrentPageIndex((prev) =>
                    (prev + 1) * PAGES_PER_VIEW >= pages.length
                      ? prev
                      : prev + 1
                  )
                }
                disabled={(currentPageIndex + 1) * PAGES_PER_VIEW >= pages.length}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </Page>
  );
}
