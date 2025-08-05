import { useState, useEffect } from "react";
import { Page, Card, Button, Text } from "@shopify/polaris";

export default function SocialChatDashboard() {
  const [fbPages, setFbPages] = useState([]);
  const [igPages, setIgPages] = useState([]);
  const [fbConnected, setFbConnected] = useState(false);
  const [igConnected, setIgConnected] = useState(false);
  const [waConnected, setWaConnected] = useState(false);

  const [selectedPage, setSelectedPage] = useState(null);
  const [pageAccessTokens, setPageAccessTokens] = useState({});
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  const [waConversations, setWaConversations] = useState([]);
  const [waMessages, setWaMessages] = useState([]);
  const [waSelectedConversation, setWaSelectedConversation] = useState(null);

  const FACEBOOK_APP_ID = "544704651303656";
  const WHATSAPP_PHONE_NUMBER_ID = "YOUR_PHONE_NUMBER_ID";
  const WHATSAPP_ACCESS_TOKEN = "YOUR_PERMANENT_ACCESS_TOKEN";

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
      fjs.parentNode.insertBefore(js, fjs);
    })(document, "script", "facebook-jssdk");
  }, []);

  const resetFbData = () => {
    setFbPages([]);
    setFbConnected(false);
    if (selectedPage?.type === "facebook") {
      setSelectedPage(null);
      setConversations([]);
      setMessages([]);
    }
  };

  const resetIgData = () => {
    setIgPages([]);
    setIgConnected(false);
    if (selectedPage?.type === "instagram") {
      setSelectedPage(null);
      setConversations([]);
      setMessages([]);
    }
  };

  const handleFacebookLogin = () => {
    window.FB.login(
      (res) => {
        if (res.authResponse) {
          resetIgData();
          fetchFacebookPages(res.authResponse.accessToken);
        }
      },
      {
        scope: "pages_show_list,pages_messaging,pages_read_engagement,pages_manage_posts",
      }
    );
  };

  const handleInstagramLogin = () => {
    window.FB.login(
      (res) => {
        if (res.authResponse) {
          resetFbData();
          fetchInstagramPages(res.authResponse.accessToken);
        }
      },
      {
        scope:
          "pages_show_list,instagram_basic,instagram_manage_messages,pages_read_engagement,pages_manage_metadata",
      }
    );
  };

  const handleWhatsappConnect = async () => {
    setWaConnected(true);
    await fetchWhatsappConversations();
  };

  const fetchFacebookPages = async (accessToken) => {
    const res = await fetch(
      `https://graph.facebook.com/me/accounts?fields=access_token,name,id&access_token=${accessToken}`
    );
    const data = await res.json();

    if (!Array.isArray(data?.data) || data.data.length === 0) {
      alert("No Facebook pages found.");
      return;
    }

    const tokens = {};
    const pages = data.data.map((page) => {
      tokens[page.id] = page.access_token;
      return { ...page, type: "facebook" };
    });

    setPageAccessTokens((prev) => ({ ...prev, ...tokens }));
    setFbPages(pages);
    setFbConnected(true);
    setSelectedPage(pages[0]);
    fetchConversations(pages[0]);
  };

  const fetchInstagramPages = async (accessToken) => {
    const res = await fetch(
      `https://graph.facebook.com/me/accounts?fields=access_token,name,id,instagram_business_account&access_token=${accessToken}`
    );
    const data = await res.json();

    const igPages = (data.data || []).filter((p) => p.instagram_business_account);
    if (igPages.length === 0) {
      alert("No Instagram business accounts found.");
      return;
    }

    const tokens = {};
    const enriched = igPages.map((page) => {
      tokens[page.id] = page.access_token;
      return {
        ...page,
        type: "instagram",
        igId: page.instagram_business_account.id,
      };
    });

    setPageAccessTokens((prev) => ({ ...prev, ...tokens }));
    setIgPages(enriched);
    setIgConnected(true);
    setSelectedPage(enriched[0]);
    fetchConversations(enriched[0]);
  };

  const fetchConversations = async (page) => {
    const token = pageAccessTokens[page.id];
    setSelectedPage(page);
    setSelectedConversation(null);
    setMessages([]);

    const res = await fetch(
      `https://graph.facebook.com/v18.0/${page.id}/conversations?${
        page.type === "instagram" ? "platform=instagram&" : ""
      }fields=participants&access_token=${token}`
    );
    const data = await res.json();

    if (page.type === "instagram") {
      const enriched = await Promise.all(
        (data.data || []).map(async (conv) => {
          const msgRes = await fetch(
            `https://graph.facebook.com/v18.0/${conv.id}/messages?fields=from,message&limit=5&access_token=${token}`
          );
          const msgData = await msgRes.json();
          const messages = msgData?.data || [];
          const otherMsg = messages.find((m) => m.from?.id !== page.igId);
          let userName = "Instagram User";
          if (otherMsg) {
            userName = otherMsg.from?.name || otherMsg.from?.username || "Instagram User";
          }
          return {
            ...conv,
            userName,
            businessName: page.name,
          };
        })
      );
      setConversations(enriched);
    } else {
      setConversations(data.data || []);
    }
  };

  const fetchMessages = async (conv) => {
    if (!selectedPage) return;
    const token = pageAccessTokens[selectedPage.id];

    const res = await fetch(
      `https://graph.facebook.com/v18.0/${conv.id}/messages?fields=from,message,created_time&access_token=${token}`
    );
    const data = await res.json();
    const rawMessages = data?.data?.reverse() || [];

    const enrichedMessages = rawMessages.map((msg) => {
      let displayName = "User";

      if (selectedPage.type === "instagram") {
        if (msg.from?.id === selectedPage.igId) {
          displayName = selectedPage.name;
        } else {
          displayName =
            conv.userName ||
            msg.from?.name ||
            msg.from?.username ||
            `Instagram User #${msg.from?.id?.slice(-4)}`;
        }
      } else {
        if (msg.from?.name === selectedPage.name) {
          displayName = selectedPage.name;
        } else {
          displayName = msg.from?.name || "User";
        }
      }

      return {
        ...msg,
        displayName,
      };
    });

    setMessages(enrichedMessages);
    setSelectedConversation(conv);
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    if (selectedPage) {
      const token = pageAccessTokens[selectedPage.id];

      if (selectedPage.type === "instagram") {
        const msgRes = await fetch(
          `https://graph.facebook.com/v18.0/${selectedConversation.id}/messages?fields=from&access_token=${token}`
        );
        const msgData = await msgRes.json();
        const sender = msgData?.data?.find((m) => m.from?.id !== selectedPage.igId);
        if (!sender) return alert("Recipient not found");

        await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${token}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messaging_product: "instagram",
            recipient: { id: sender.from.id },
            message: { text: newMessage },
          }),
        });
      } else {
        const participants = selectedConversation.participants?.data || [];
        const recipient = participants.find((p) => p.name !== selectedPage.name);
        if (!recipient) return alert("Recipient not found");

        await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${token}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipient: { id: recipient.id },
            message: { text: newMessage },
            messaging_type: "MESSAGE_TAG",
            tag: "ACCOUNT_UPDATE",
          }),
        });
      }

      setNewMessage("");
      fetchMessages(selectedConversation);
    } else if (waSelectedConversation) {
      await fetch(`https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: waSelectedConversation,
          type: "text",
          text: { body: newMessage },
        }),
      });

      setNewMessage("");
      fetchWhatsappMessages(waSelectedConversation);
    }
  };

  const fetchWhatsappConversations = async () => {
    const res = await fetch(
      `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/conversations`,
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        },
      }
    );
    const data = await res.json();
    setWaConversations(data.data || []);
  };

  const fetchWhatsappMessages = async (conversationId) => {
    const res = await fetch(
      `https://graph.facebook.com/v18.0/${conversationId}/messages?access_token=${WHATSAPP_ACCESS_TOKEN}`
    );
    const data = await res.json();
    setWaMessages(data.data || []);
    setWaSelectedConversation(conversationId);
  };

  return (
    <Page title="📱 Social Chat Dashboard">
      <Card sectioned>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <Button onClick={handleFacebookLogin} primary disabled={fbConnected}>
            Connect Facebook
          </Button>
          <div style={{ marginTop: 10 }}>
            <Button onClick={handleInstagramLogin} disabled={igConnected}>
              Connect Instagram
            </Button>
          </div>
          <div style={{ marginTop: 10 }}>
            <Button onClick={handleWhatsappConnect} disabled={waConnected}>
              Connect WhatsApp
            </Button>
          </div>
        </div>

        {/* Facebook/Instagram UI */}
        {selectedPage && (
          <div style={{ display: "flex", border: "1px solid #ccc", borderRadius: 8, height: 650 }}>
            <div style={{ width: "30%", borderRight: "1px solid #eee", overflowY: "auto" }}>
              <Text variant="headingMd" style={{ padding: 12 }}>
                {selectedPage.type === "instagram" ? "Instagram" : "Facebook"} Conversations
              </Text>
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => fetchMessages(conv)}
                  style={{
                    padding: 12,
                    cursor: "pointer",
                    backgroundColor: selectedConversation?.id === conv.id ? "#e7f1ff" : "white",
                  }}
                >
                  <Text>{conv.userName || conv.id}</Text>
                </div>
              ))}
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <Text variant="headingMd" style={{ padding: 12, borderBottom: "1px solid #ddd" }}>
                Chat
              </Text>
              <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
                {messages.map((msg) => (
                  <div key={msg.id} style={{ marginBottom: 10 }}>
                    <strong>{msg.displayName}</strong>
                    <div>{msg.message}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", padding: 12 }}>
                <input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message"
                  style={{ flex: 1, padding: 10, borderRadius: 5, border: "1px solid #ccc" }}
                />
                <Button onClick={sendMessage} primary style={{ marginLeft: 10 }}>
                  Send
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* WhatsApp UI */}
        {waConnected && (
          <div style={{ display: "flex", border: "1px solid #ccc", borderRadius: 8, height: 650, marginTop: 20 }}>
            <div style={{ width: "30%", borderRight: "1px solid #eee", overflowY: "auto" }}>
              <Text variant="headingMd" style={{ padding: 12 }}>
                WhatsApp Conversations
              </Text>
              {waConversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => fetchWhatsappMessages(conv.id)}
                  style={{
                    padding: 12,
                    cursor: "pointer",
                    backgroundColor: waSelectedConversation === conv.id ? "#e7f1ff" : "white",
                  }}
                >
                  <Text>{conv.id}</Text>
                </div>
              ))}
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <Text variant="headingMd" style={{ padding: 12, borderBottom: "1px solid #ddd" }}>
                WA Chat
              </Text>
              <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
                {waMessages.map((msg) => (
                  <div key={msg.id} style={{ marginBottom: 10 }}>
                    <strong>{msg.from}</strong>
                    <div>{msg.text?.body}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", padding: 12 }}>
                <input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message"
                  style={{ flex: 1, padding: 10, borderRadius: 5, border: "1px solid #ccc" }}
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
