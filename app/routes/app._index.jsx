// File: SocialChatDashboard.jsx
import { useState, useEffect } from "react";
import { Page, Card, Button, Text } from "@shopify/polaris";

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

  const [waPhoneNumber, setWaPhoneNumber] = useState("");
  const [waMessage, setWaMessage] = useState("");

  const FACEBOOK_APP_ID = "YOUR_FACEBOOK_APP_ID";
  const WHATSAPP_TOKEN = "YOUR_WHATSAPP_TOKEN";
  const WHATSAPP_PHONE_ID = "YOUR_PHONE_NUMBER_ID";

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
    await fetchConversations(pages[0]);
  };

  const fetchInstagramPages = async (accessToken) => {
    const res = await fetch(
      `https://graph.facebook.com/me/accounts?fields=access_token,name,id,instagram_business_account&access_token=${accessToken}`
    );
    const data = await res.json();

    if (!Array.isArray(data?.data)) {
      alert("Instagram account response is invalid.");
      return;
    }

    const igPages = data.data.filter((p) => p.instagram_business_account);
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
    await fetchConversations(enriched[0]);
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

      const createdTime = msg.created_time
        ? new Date(msg.created_time).toLocaleString()
        : "Time unavailable";

      return {
        ...msg,
        displayName,
        formattedTime: createdTime,
      };
    });

    setMessages(enrichedMessages);
    setSelectedConversation(conv);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedPage || !selectedConversation) return;
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
  };

  const sendWhatsAppMessage = async () => {
    if (!waPhoneNumber || !waMessage) return alert("Enter number and message");

    const res = await fetch(`https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_ID}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: waPhoneNumber,
        type: "text",
        text: { body: waMessage },
      }),
    });

    const data = await res.json();
    if (data?.messages) {
      alert("Message sent successfully");
      setWaMessage("");
    } else {
      alert("Failed to send message");
      console.error(data);
    }
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

          <div style={{ marginTop: 20, borderTop: "1px solid #ccc", paddingTop: 20 }}>
            <Text variant="headingMd">Send WhatsApp Message</Text>
            <div style={{ marginTop: 10 }}>
              <input
                type="text"
                placeholder="Phone number with country code"
                value={waPhoneNumber}
                onChange={(e) => setWaPhoneNumber(e.target.value)}
                style={{ padding: 8, marginRight: 10, width: 200 }}
              />
              <input
                type="text"
                placeholder="Your message"
                value={waMessage}
                onChange={(e) => setWaMessage(e.target.value)}
                style={{ padding: 8, marginRight: 10, width: 300 }}
              />
              <Button onClick={sendWhatsAppMessage}>Send WhatsApp</Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Chat Section */}
      <Card sectioned>
        {selectedPage && (
          <div>
            <h3>Conversations ({selectedPage.name})</h3>
            <ul>
              {conversations.map((conv) => (
                <li key={conv.id}>
                  <Button onClick={() => fetchMessages(conv)}>
                    {conv.userName || conv.id}
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {selectedConversation && (
          <div style={{ marginTop: 20 }}>
            <h3>Messages</h3>
            <div style={{ maxHeight: 300, overflowY: "auto", marginBottom: 10 }}>
              {messages.map((msg) => (
                <div key={msg.id}>
                  <strong>{msg.displayName}</strong>: {msg.message?.text || msg.message}
                  <div style={{ fontSize: 12, color: "#888" }}>{msg.formattedTime}</div>
                  <hr />
                </div>
              ))}
            </div>
            <input
              type="text"
              placeholder="Type a reply..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              style={{ padding: 8, width: "60%" }}
            />
            <Button onClick={sendMessage} style={{ marginLeft: 10 }}>
              Send
            </Button>
          </div>
        )}
      </Card>
    </Page>
  );
}
