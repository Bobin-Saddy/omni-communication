import { useState, useEffect } from "react";
import { Page, Card, Button, Text, Badge } from "@shopify/polaris";

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
      if (fjs && fjs.parentNode) fjs.parentNode.insertBefore(js, fjs);
      else d.head.appendChild(js);
    })(document, "script", "facebook-jssdk");
  }, []);

  const handleFacebookLogin = () => {
    window.FB.login(
      (resp) => resp.authResponse && fetchPages(resp.authResponse.accessToken, "facebook"),
      { scope: "pages_show_list,pages_messaging,pages_read_engagement,pages_manage_posts" }
    );
  };

  const handleInstagramLogin = () => {
    window.FB.login(
      (resp) => resp.authResponse && fetchPages(resp.authResponse.accessToken, "instagram"),
      { scope: "pages_show_list,instagram_basic,instagram_manage_messages" }
    );
  };

  const fetchPages = (token, type) => {
    fetch(`https://graph.facebook.com/me/accounts?access_token=${token}`)
      .then((r) => r.json())
      .then((data) => {
        const tokens = {}, pages = [];
        data.data?.forEach((p) => {
          tokens[p.id] = p.access_token;
          pages.push({ ...p, type });
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
    const token = pageAccessTokens[page.id];
    setSelectedPage(page);
    setConversations([]);
    setSelectedConversation(null);
    setMessages([]);

    fetch(`https://graph.facebook.com/${page.id}/conversations?fields=participants&access_token=${token}`)
      .then((r) => r.json())
      .then((data) => setConversations(data.data || []));
  };

  const fetchMessages = (conv) => {
    const token = pageAccessTokens[selectedPage.id];
    setSelectedConversation(conv);
    const rec = conv.participants.data.find((p) => p.name !== selectedPage.name);
    setRecipientId(rec?.id || null);

    fetch(`https://graph.facebook.com/${conv.id}/messages?fields=from,message,created_time&access_token=${token}`)
      .then((r) => r.json())
      .then((data) => setMessages(data.data?.reverse() || []));
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !recipientId) return;
    const token = pageAccessTokens[selectedPage.id];
    fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text: newMessage },
        messaging_type: "MESSAGE_TAG",
        tag: "ACCOUNT_UPDATE",
      }),
    }).then((r) => r.json()).then((data) => {
      if (data.message_id) {
        setNewMessage("");
        fetchMessages(selectedConversation);
      }
    });
  };

  const allPages = [...fbPages, ...igPages];

  return (
    <Page title="Social Chat Dashboard">
      <Card sectioned>
        {!fbConnected && (
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <Button onClick={handleFacebookLogin} primary>Connect Facebook</Button>
            <Button onClick={handleInstagramLogin} style={{ marginLeft: 10 }}>Connect Instagram</Button>
          </div>
        )}

        {fbConnected && (
          <div style={{ display: "flex", height: "600px", border: "1px solid #ddd", borderRadius: 8 }}>
            {/* Pages */}
            <div style={{ width: "25%", borderRight: "1px solid #eee", overflowY: "auto" }}>
              <Text variant="headingMd" style={{ padding: 12 }}>Pages</Text>
              {allPages.map((pg) => (
                <div
                  key={pg.id}
                  onClick={() => fetchConversations(pg)}
                  style={{
                    padding: 12, cursor: "pointer",
                    backgroundColor: selectedPage?.id === pg.id ? "#e3f2fd" : "white"
                  }}
                >
                  <Text>{pg.name} ({pg.type === "instagram" ? "IG" : "FB"})</Text>
                </div>
              ))}
            </div>

            {/* Conversations */}
            <div style={{ width: "30%", borderRight: "1px solid #eee", overflowY: "auto" }}>
              <Text variant="headingMd" style={{ padding: 12 }}>Conversations</Text>
              {conversations.map((conv) => {
                const names = conv.participants.data.filter((p) => p.name !== selectedPage.name)
                  .map((p) => p.name).join(", ");
                return (
                  <div
                    key={conv.id}
                    onClick={() => fetchMessages(conv)}
                    style={{
                      padding: 12, cursor: "pointer",
                      backgroundColor: selectedConversation?.id === conv.id ? "#e7f1ff" : "white"
                    }}
                  >
                    <Text><strong>{names}</strong></Text>
                  </div>
                );
              })}
            </div>

            {/* Messages */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <Text variant="headingMd" style={{ padding: 12, borderBottom: "1px solid #ddd" }}>Chat</Text>
              <div style={{ flex: 1, padding: 12, overflowY: "auto", background: "#f9f9f9" }}>
                {messages.map((msg) => (
                  <div key={msg.id} style={{
                    textAlign: msg.from?.name === selectedPage?.name ? "right" : "left",
                    marginBottom: 10
                  }}>
                    <div style={{
                      display: "inline-block", padding: 10, borderRadius: 8,
                      backgroundColor: msg.from?.name === selectedPage?.name ? "#d1e7dd" : "white",
                      border: "1px solid #ccc"
                    }}>
                      <strong>{msg.from?.name}</strong>
                      <div>{msg.message}</div>
                      <small>{new Date(msg.created_time).toLocaleString()}</small>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", padding: 12, borderTop: "1px solid #ddd" }}>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type message..."
                  style={{ flex: 1, padding: 8, border: "1px solid #ccc", borderRadius: 5 }}
                />
                <Button onClick={sendMessage} primary style={{ marginLeft: 8 }}>Send</Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </Page>
  );
}
