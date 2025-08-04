import React, { useState, useEffect } from "react";
import { Page, Card, Button, Text, Badge, Icon } from "@shopify/polaris";
import { ChatMajor, SocialAdMajor, MobileMajor } from '@shopify/polaris-icons';

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

  const handleLogin = (platform) => () => {
    window.FB.login(
      (res) => {
        if (res.authResponse) {
          fetchPages(res.authResponse.accessToken, platform);
        }
      },
      {
        scope:
          platform === "facebook"
            ? "pages_show_list,pages_messaging,pages_manage_posts,pages_read_engagement"
            : "pages_show_list,instagram_basic,instagram_manage_messages,pages_read_engagement,pages_manage_metadata",
      }
    );
  };

  const fetchPages = async (token, platform) => {
    const url =
      platform === "instagram"
        ? `https://graph.facebook.com/me/accounts?fields=instagram_business_account,id,name,access_token&access_token=${token}`
        : `https://graph.facebook.com/me/accounts?fields=id,name,access_token&access_token=${token}`;
    const res = await fetch(url);
    const data = await res.json();
    const items = data.data || [];

    const tokens = {};
    const pages = items
      .filter((p) => (platform === "instagram" ? p.instagram_business_account : true))
      .map((p) => {
        tokens[p.id] = p.access_token;
        return { ...p, platform };
      });

    setPageAccessTokens((prev) => ({ ...prev, ...tokens }));
    if (platform === "facebook") {
      setFbPages(pages);
      setFbConnected(true);
      fetchConversations(pages[0]);
    } else {
      setIgPages(pages);
      setIgConnected(true);
      fetchConversations(pages[0]);
    }
  };

  const fetchConversations = async (page) => {
    setSelectedPage(page);
    setSelectedConversation(null);
    setMessages([]);
    const token = pageAccessTokens[page.id];
    const query = page.platform === "instagram" ? "&platform=instagram" : "";
    const res = await fetch(
      `https://graph.facebook.com/v18.0/${page.id}/conversations?fields=participants${query}&access_token=${token}`
    );
    const data = await res.json();
    setConversations(data.data || []);
  };

  const fetchMessages = async (conv) => {
    setSelectedConversation(conv);
    const page = selectedPage;
    const token = pageAccessTokens[page.id];
    const res = await fetch(
      `https://graph.facebook.com/v18.0/${conv.id}/messages?fields=from,message,created_time&access_token=${token}`
    );
    const data = await res.json();
    setMessages(data.data?.reverse() || []);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedPage || !selectedConversation) return;
    const page = selectedPage;
    const token = pageAccessTokens[page.id];

    const participant = selectedConversation.participants.data.find(
      (p) => p.name !== selectedPage.name
    );
    if (!participant) return alert("Recipient missing");

    await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: participant.id },
        message: { text: newMessage },
        messaging_type: "MESSAGE_TAG",
        tag: "ACCOUNT_UPDATE",
      }),
    });

    const newMsg = {
      id: `msg_${Date.now()}`,
      from: { name: selectedPage.name },
      message: newMessage,
      created_time: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newMsg]);
    setNewMessage("");
  };

  const allPages = [...fbPages, ...igPages];

  return (
    <Page title="Social Chat Dashboard">
      <Card sectioned>
        <div style={{ display: "flex", justifyContent: "center", gap: 16, marginBottom: 20 }}>
          <Button icon={SocialAdMajor} onClick={handleLogin("facebook")} primary>
            {fbConnected ? "Facebook Connected" : "Connect Facebook"}
          </Button>
          <Button icon={MobileMajor} onClick={handleLogin("instagram")}>
            {igConnected ? "Instagram Connected" : "Connect Instagram"}
          </Button>
        </div>

        {(fbConnected || igConnected) && (
          <div
            style={{
              display: "flex",
              height: 700,
              width: "100%",
              border: "1px solid #ccc",
              borderRadius: 8,
              overflow: "hidden",
              boxShadow: "0 0 10px rgba(0,0,0,0.1)",
            }}
          >
            {/* Pages */}
            <div style={{ width: "20%", borderRight: "1px solid #eee", overflowY: "auto", background: "#f6f8fa" }}>
              <Text variant="headingMd" alignment="center" as="h4" style={{ padding: 12 }}>
                Pages
              </Text>
              {allPages.map((pg) => (
                <div
                  key={pg.id}
                  onClick={() => fetchConversations(pg)}
                  style={{
                    padding: 12,
                    cursor: "pointer",
                    backgroundColor: selectedPage?.id === pg.id ? "#e8f4fd" : "white",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span>{pg.name}</span>
                  <Badge status={pg.platform === "instagram" ? "info" : "attention"}>
                    {pg.platform.toUpperCase()}
                  </Badge>
                </div>
              ))}
            </div>

            {/* Conversations */}
            <div style={{ width: "28%", borderRight: "1px solid #eee", overflowY: "auto", background: "#fff" }}>
              <Text variant="headingMd" alignment="center" as="h4" style={{ padding: 12 }}>
                Conversations
              </Text>
              {conversations.map((c) => {
                const label = selectedPage.platform === "instagram"
                  ? `${c.id}`
                  : c.participants.data
                      .filter((p) => p.name !== selectedPage.name)
                      .map((p) => p.name)
                      .join(", ");
                return (
                  <div
                    key={c.id}
                    onClick={() => fetchMessages(c)}
                    style={{
                      padding: 12,
                      cursor: "pointer",
                      backgroundColor: selectedConversation?.id === c.id ? "#f1faff" : "white",
                    }}
                  >
                    <Text>{label}</Text>
                  </div>
                );
              })}
            </div>

            {/* Chat */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#fefefe" }}>
              <Text variant="headingMd" style={{ padding: 12, borderBottom: "1px solid #ddd" }}>
                Chat Box <Icon source={ChatMajor} color="base" />
              </Text>
              <div style={{ flex: 1, overflowY: "auto", padding: 16, background: "#f9f9f9" }}>
                {messages.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      textAlign: m.from?.name === selectedPage.name ? "right" : "left",
                      marginBottom: 10,
                    }}
                  >
                    <div
                      style={{
                        display: "inline-block",
                        padding: 10,
                        borderRadius: 8,
                        maxWidth: "80%",
                        backgroundColor: m.from?.name === selectedPage?.name ? "#dcf8c6" : "#fff",
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
              <div style={{ display: "flex", padding: 12, borderTop: "1px solid #ddd", background: "#fff" }}>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  style={{
                    flex: 1,
                    padding: 10,
                    borderRadius: 5,
                    border: "1px solid #ccc",
                    fontSize: 14,
                  }}
                />
                <Button onClick={sendMessage} primary style={{ marginLeft: 10 }}>
                  Send
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </Page>
  );
}
