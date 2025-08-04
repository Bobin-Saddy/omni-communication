import React, { useState, useEffect } from "react";
import { Page, Card, Button, Text } from "@shopify/polaris";

export default function SocialChatDashboard() {
  const [fbPages, setFbPages] = useState([]);
  const [igPages, setIgPages] = useState([]);
  const [fbConnected, setFbConnected] = useState(false);
  const [igConnected, setIgConnected] = useState(false);
  const [selectedFbPage, setSelectedFbPage] = useState(null);
  const [selectedIgPage, setSelectedIgPage] = useState(null);
  const [pageAccessTokens, setPageAccessTokens] = useState({});
  const [fbConversations, setFbConversations] = useState([]);
  const [igConversations, setIgConversations] = useState([]);
  const [selectedFbConversation, setSelectedFbConversation] = useState(null);
  const [selectedIgConversation, setSelectedIgConversation] = useState(null);
  const [fbMessages, setFbMessages] = useState([]);
  const [igMessages, setIgMessages] = useState([]);
  const [fbNewMessage, setFbNewMessage] = useState("");
  const [igNewMessage, setIgNewMessage] = useState("");

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
      const fjs = d.getElementsByTagName(s)[0];
      fjs?.parentNode?.insertBefore(js, fjs);
    })(document, "script", "facebook-jssdk");
  }, []);

  const handleFacebookLogin = () =>
    window.FB.login(
      (res) => {
        if (res.authResponse) {
          fetchPages(res.authResponse.accessToken, "facebook");
        }
      },
      {
        scope:
          "pages_show_list,pages_messaging,pages_manage_posts,pages_read_engagement",
      }
    );

  const handleInstagramLogin = () =>
    window.FB.login(
      (res) => {
        if (res.authResponse) {
          fetchPages(res.authResponse.accessToken, "instagram");
        }
      },
      {
        scope:
          "pages_show_list,instagram_basic,instagram_manage_messages,pages_read_engagement,pages_manage_metadata",
      }
    );

  const fetchPages = async (token, platform) => {
    const url = `https://graph.facebook.com/me/accounts?fields=instagram_business_account,id,name,access_token&access_token=${token}`;
    const res = await fetch(url);
    const data = await res.json();
    const items = data.data || [];

    const tokens = {};
    const pages = items
      .filter((p) =>
        platform === "instagram" ? p.instagram_business_account : true
      )
      .map((p) => {
        const pageId =
          platform === "instagram"
            ? p.instagram_business_account?.id
            : p.id;
        tokens[pageId] = p.access_token;
        return {
          id: pageId,
          name: p.name,
          pageId: p.id,
          platform,
        };
      });

    setPageAccessTokens((prev) => ({ ...prev, ...tokens }));

    if (platform === "facebook") {
      setFbPages(pages);
      setFbConnected(true);
      fetchConversations(pages[0], "facebook");
    } else {
      setIgPages(pages);
      setIgConnected(true);
      fetchConversations(pages[0], "instagram");
    }
  };

  const fetchConversations = async (page, platform) => {
    const token = pageAccessTokens[page.id];
    const res = await fetch(
      `https://graph.facebook.com/v18.0/${page.id}/conversations?fields=participants&access_token=${token}`
    );
    const data = await res.json();
    const convs = data.data || [];

    if (platform === "facebook") {
      setSelectedFbPage(page);
      setFbConversations(convs);
      setFbMessages([]);
      setSelectedFbConversation(null);
    } else {
      setSelectedIgPage(page);
      setIgConversations(convs);
      setIgMessages([]);
      setSelectedIgConversation(null);
    }
  };

  const fetchMessages = async (conv, platform) => {
    const page = platform === "facebook" ? selectedFbPage : selectedIgPage;
    const token = pageAccessTokens[page.id];
    const res = await fetch(
      `https://graph.facebook.com/v18.0/${conv.id}/messages?fields=from,message,created_time&access_token=${token}`
    );
    const data = await res.json();
    const msgs = data.data?.reverse() || [];

    if (platform === "facebook") {
      setSelectedFbConversation(conv);
      setFbMessages(msgs);
    } else {
      setSelectedIgConversation(conv);
      setIgMessages(msgs);
    }
  };

  const sendMessage = async (platform) => {
    const page = platform === "facebook" ? selectedFbPage : selectedIgPage;
    const conv =
      platform === "facebook" ? selectedFbConversation : selectedIgConversation;
    const message = platform === "facebook" ? fbNewMessage : igNewMessage;
    const token = pageAccessTokens[page.id];

    if (!message.trim()) return;

    try {
      if (platform === "instagram") {
        const resp = await fetch(
          `https://graph.facebook.com/v18.0/${conv.id}/messages?fields=from&access_token=${token}`
        );
        const d = await resp.json();
        const sender = d.data?.find((m) => m.from?.id !== page.id);
        if (!sender) return alert("Could not find recipient");

        await fetch(
          `https://graph.facebook.com/v18.0/me/messages?access_token=${token}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messaging_product: "instagram",
              recipient: { id: sender.from.id },
              message: { text: message },
            }),
          }
        );
      } else {
        const participant = conv.participants.data.find(
          (p) => p.name !== page.name
        );
        if (!participant) return alert("Recipient missing");

        await fetch(
          `https://graph.facebook.com/v18.0/me/messages?access_token=${token}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              recipient: { id: participant.id },
              message: { text: message },
              messaging_type: "MESSAGE_TAG",
              tag: "ACCOUNT_UPDATE",
            }),
          }
        );
      }

      const newMsg = {
        id: `msg_${Date.now()}`,
        from: { name: page.name },
        message: message,
        created_time: new Date().toISOString(),
      };

      if (platform === "facebook") {
        setFbMessages((prev) => [...prev, newMsg]);
        setFbNewMessage("");
      } else {
        setIgMessages((prev) => [...prev, newMsg]);
        setIgNewMessage("");
      }
    } catch (err) {
      console.error("Send error:", err);
    }
  };

  const renderChatUI = (platform) => {
    const isFB = platform === "facebook";
    const page = isFB ? selectedFbPage : selectedIgPage;
    const conversations = isFB ? fbConversations : igConversations;
    const selectedConversation = isFB
      ? selectedFbConversation
      : selectedIgConversation;
    const messages = isFB ? fbMessages : igMessages;
    const newMessage = isFB ? fbNewMessage : igNewMessage;
    const setNewMessage = isFB ? setFbNewMessage : setIgNewMessage;

    return (
      <Card sectioned title={`${platform.toUpperCase()} Chat`}>
        <div style={{ display: "flex", height: 600, overflow: "hidden" }}>
          {/* Conversations */}
          <div style={{ width: "30%", borderRight: "1px solid #eee" }}>
            <Text variant="headingMd" style={{ padding: 10 }}>
              Conversations
            </Text>
            <div style={{ overflowY: "auto", height: 550 }}>
              {conversations.map((c) => {
                const label = c.participants.data
                  .filter((p) => p.name !== page.name)
                  .map((p) => p.name)
                  .join(", ");
                return (
                  <div
                    key={c.id}
                    onClick={() => fetchMessages(c, platform)}
                    style={{
                      padding: 10,
                      backgroundColor:
                        selectedConversation?.id === c.id ? "#e3f2fd" : "#fff",
                      cursor: "pointer",
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    <Text>{label || "Unknown"}</Text>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <Text
              variant="headingMd"
              style={{
                padding: 10,
                borderBottom: "1px solid #ccc",
                background: "#fafafa",
              }}
            >
              Chat
            </Text>
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: 12,
                background: "#fff",
              }}
            >
              {messages.map((m) => (
                <div
                  key={m.id}
                  style={{
                    textAlign: m.from?.name === page.name ? "right" : "left",
                    marginBottom: 10,
                  }}
                >
                  <div
                    style={{
                      display: "inline-block",
                      padding: 10,
                      borderRadius: 8,
                      backgroundColor:
                        m.from?.name === page.name
                          ? isFB
                            ? "#d1e7dd"
                            : "#ffe0f0"
                          : isFB
                          ? "#f1f1f1"
                          : "#ede7f6",
                      border: "1px solid #ccc",
                    }}
                  >
                    <strong>{m.from?.name}</strong>
                    <div>{m.message}</div>
                    <small>{new Date(m.created_time).toLocaleString()}</small>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", padding: 10, borderTop: "1px solid #ccc" }}>
              <input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                style={{
                  flex: 1,
                  padding: 10,
                  borderRadius: 6,
                  border: "1px solid #ccc",
                }}
                placeholder="Type a message..."
              />
              <Button onClick={() => sendMessage(platform)} primary style={{ marginLeft: 10 }}>
                Send
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <Page title="Social Chat Dashboard">
      <Card sectioned>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <Button onClick={handleFacebookLogin} primary>
            {fbConnected ? "Facebook Connected" : "Connect Facebook"}
          </Button>
          <Button onClick={handleInstagramLogin} style={{ marginLeft: 10 }}>
            {igConnected ? "Instagram Connected" : "Connect Instagram"}
          </Button>
        </div>
        {fbConnected && selectedFbPage && renderChatUI("facebook")}
        {igConnected && selectedIgPage && renderChatUI("instagram")}
      </Card>
    </Page>
  );
}
