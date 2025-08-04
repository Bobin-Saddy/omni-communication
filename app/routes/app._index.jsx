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
      (res) => res.authResponse && fetchPages(res.authResponse.accessToken, "facebook"),
      { scope: "pages_show_list,pages_messaging,pages_read_engagement,pages_manage_posts" }
    );
  };

  const handleInstagramLogin = () => {
    window.FB.login(
      (res) => res.authResponse && fetchPages(res.authResponse.accessToken, "instagram"),
      { scope: "pages_show_list,instagram_basic,instagram_manage_messages,pages_read_engagement,pages_manage_metadata" }
    );
  };

  const fetchPages = async (userToken, type) => {
    try {
      const resp = await fetch(`https://graph.facebook.com/me/accounts?fields=${type === 'instagram' ? 'instagram_business_account' : ''},access_token,name,id&access_token=${userToken}`);
      const data = await resp.json();
      const tokens = {};
      const list = data.data
        .filter((p) => (type === "instagram" ? p.instagram_business_account : true))
        .map((p) => {
          tokens[p.id] = p.access_token;
          return { ...p, type };
        });
      setPageAccessTokens((prev) => ({ ...prev, ...tokens }));
      if (type === "facebook") {
        setFbPages(list);
        setFbConnected(true);
      } else {
        setIgPages(list);
        setIgConnected(true);
      }
    } catch (err) {
      console.error("Error fetching pages:", err);
    }
  };

  const allPages = [...fbPages, ...igPages];

  const fetchConversations = async (page) => {
    const token = pageAccessTokens[page.id];
    setSelectedPage(page);
    setSelectedConversation(null);
    setMessages([]);
    try {
      const convResp = await fetch(
        `https://graph.facebook.com/v18.0/${page.id}/conversations?fields=participants${page.type === "instagram" ? "&platform=instagram" : ""}&access_token=${token}`
      );
      const convData = await convResp.json();
      const convList = convData.data || [];
      // for IG, fetch first message to get userName/business
      const enriched = await Promise.all(
        convList.map(async (c) => {
          if (page.type === "instagram") {
            const m = await fetch(
              `https://graph.facebook.com/v18.0/${c.id}/messages?fields=from,message&limit=1&access_token=${token}`
            ).then((r) => r.json());
            const msg = m.data?.[0];
            return {
              ...c,
              userName: msg?.from?.name || msg?.from?.username || "User",
              businessName: page.name,
            };
          }
          return { ...c };
        })
      );
      setConversations(enriched);
      setNewMessages((prev) =>
        enriched.reduce((acc, cv) => ({ ...acc, [cv.id]: false }), {})
      );
    } catch (err) {
      console.error("Error loading conversations:", err);
    }
  };

  const fetchMessages = async (conv) => {
    const toks = pageAccessTokens[selectedPage.id];
    setSelectedConversation(conv);
    const resp = await fetch(
      `https://graph.facebook.com/v18.0/${conv.id}/messages?fields=from,message,created_time&access_token=${toks}`
    );
    const d = await resp.json();
    setMessages(d.data?.reverse() || []);
    setNewMessages((prev) => ({ ...prev, [conv.id]: false }));
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedPage || !selectedConversation) return;
    const token = pageAccessTokens[selectedPage.id];
    if (selectedPage.type === "instagram") {
      const msgs = await fetch(
        `https://graph.facebook.com/v18.0/${selectedConversation.id}/messages?fields=from&id&access_token=${token}`
      ).then((r) => r.json());
      const rec = msgs.data.find((m) => m.from?.id && m.from.id !== selectedPage.instagram_business_account?.id);
      if (!rec) return console.error("IG recipient ID not found");
      await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messaging_product: "instagram",
          recipient: { id: rec.from.id },
          message: { text: newMessage },
        }),
      });
    } else {
      await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: { id: recipientId },
          message: { text: newMessage },
          messaging_type: "MESSAGE_TAG",
          tag: "ACCOUNT_UPDATE",
        }),
      });
    }
    setNewMessage("");
    fetchMessages(selectedConversation);
  };

  return (
    <Page title="Social Chat Dashboard">
      <Card sectioned>
        {!fbConnected && (
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <Button onClick={handleFacebookLogin} primary>
              Connect Facebook
            </Button>
            <Button onClick={handleInstagramLogin} style={{ marginLeft: 10 }}>
              Connect Instagram
            </Button>
          </div>
        )}
        {(fbConnected || igConnected) && (
          <div style={{ display: "flex", height: 600, border: "1px solid #ccc", borderRadius: 8 }}>
            {/* Pages */}
            <div style={{ width: "25%", overflowY: "auto", borderRight: "1px solid #eee" }}>
              <Text variant="headingMd" style={{ padding: 12 }}>Pages</Text>
              {allPages.map((pg) => (
                <div
                  key={pg.id}
                  onClick={() => fetchConversations(pg)}
                  style={{
                    padding: 12,
                    cursor: "pointer",
                    backgroundColor: selectedPage?.id === pg.id ? "#e3f2fd" : "white",
                  }}
                >
                  <Text>
                    {pg.name} — {pg.type === "instagram" ? "IG" : "FB"}
                  </Text>
                </div>
              ))}
            </div>
            {/* Conversations */}
            <div style={{ width: "30%", overflowY: "auto", borderRight: "1px solid #eee" }}>
              <Text variant="headingMd" style={{ padding: 12 }}>Conversations</Text>
              {conversations.length === 0 && <div style={{ padding: 12 }}>No conversations</div>}
              {conversations.map((c) => {
                const name = selectedPage?.type === "instagram" ? `${c.businessName} ↔️ ${c.userName}` : c.participants.data.map((p) => p.name).filter((n) => n !== selectedPage.name).join(", ");
                return (
                  <div
                    key={c.id}
                    onClick={() => fetchMessages(c)}
                    style={{
                      padding: 12,
                      cursor: "pointer",
                      backgroundColor: selectedConversation?.id === c.id ? "#e7f1ff" : "white",
                    }}
                  >
                    <Text><strong>{name}</strong></Text>
                  </div>
                );
              })}
            </div>
            {/* Chat */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <Text variant="headingMd" style={{ padding: 12, borderBottom: "1px solid #ddd" }}>
                Chat
              </Text>
              <div style={{ flex: 1, overflowY: "auto", padding: 12, background: "#f9f9f9" }}>
                {messages.map((msg) => (
                  <div key={msg.id} style={{ textAlign: msg.from?.name === selectedPage?.name ? "right" : "left", marginBottom: 10 }}>
                    <div style={{ display: "inline-block", padding: 10, borderRadius: 8, background: msg.from?.name === selectedPage?.name ? "#d1e7dd" : "white", border: "1px solid #ccc" }}>
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
                  placeholder="Type a message..."
                  style={{ flex: 1, padding: 8, border: "1px solid #ccc", borderRadius: 5 }}
                />
                <Button onClick={sendMessage} primary style={{ marginLeft: 8 }}>
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
