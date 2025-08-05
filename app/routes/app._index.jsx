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
    fetchConversations(pages[0], tokens[pages[0].id]);
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

-   fetchConversations(enriched[0], tokens[enriched[0].id]);  // IG: Remove this call
+   setConversations([]); // IG does not support direct conversation fetch here
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

      // Find first message not sent by your IG account
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
}
 else {
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
        // For incoming messages
        displayName =
          conv.userName ||
          msg.from?.name ||
          msg.from?.username ||
          `Instagram User #${msg.from?.id?.slice(-4)}`;
      }
    } else {
      // Facebook
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
    if (!newMessage.trim() || !selectedPage || !selectedConversation) return;
    const token = pageAccessTokens[selectedPage.id];

    if (selectedPage.type === "instagram") {
      const msgRes = await fetch(
        `https://graph.facebook.com/v18.0/${selectedConversation.id}/messages?fields=from&access_token=${token}`
      );
      const msgData = await msgRes.json();
      const sender = msgData?.data?.find((m) => m.from?.id !== selectedPage.igId);

      if (!sender) return alert("Recipient not found");

      await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${token}` , {
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
        </div>

        {selectedPage && (
          <div
            style={{
            display: "flex",
    height: "700px",
    border: "1px solid #ddd",
    borderRadius: 12,
    overflow: "hidden",
    width: "100%",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    backgroundColor: "#fff",
            }}
          >
            <div style={{ width: "22%", borderRight: "1px solid #eee", overflowY: "auto" }}>
              <div style={{ padding: 12, borderBottom: "1px solid #ddd" }}>
                <Text variant="headingMd">Pages</Text>
              </div>
              {[...fbPages, ...igPages].map((page) => (
                <div
                  key={page.id}
                  onClick={() => fetchConversations(page, pageAccessTokens[page.id])}
            style={{
  padding: 14,
  cursor: "pointer",
  backgroundColor: selectedPage?.id === page.id ? "#333" : "transparent",
  borderBottom: "1px solid #444",
}}

                >
                  <Text>
                    {page.name} ({page.type})
                  </Text>
                </div>
              ))}
            </div>

            <div style={{ width: "28%", borderRight: "1px solid #eee", overflowY: "auto" }}>
              <div style={{ padding: 12, borderBottom: "1px solid #ddd" }}>
                <Text variant="headingMd">Conversations</Text>
              </div>
              {conversations.length === 0 && <div style={{ padding: 12 }}>No conversations available.</div>}
              {conversations.map((conv) => {
                const name =
                  selectedPage?.type === "instagram"
                    ? `${conv.businessName} ↔️ ${conv.userName}`
                    : conv.participants?.data
                        ?.filter((p) => p.name !== selectedPage.name)
                        .map((p) => p.name)
                        .join(", ");
                return (
                  <div
                    key={conv.id}
                    onClick={() => fetchMessages(conv)}
                style={{
  padding: 14,
  cursor: "pointer",
  borderBottom: "1px solid #eee",
  backgroundColor: selectedConversation?.id === conv.id ? "#e3f2fd" : "#fff",
  transition: "background-color 0.3s",
  fontSize: 14,
}}

                  >
                    <Text>{name}</Text>
                  </div>
                );
              })}
            </div>

            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <div style={{ padding: 12, borderBottom: "1px solid #ddd" }}>
                <Text variant="headingMd">Chat</Text>
              </div>
              <div style={{ flex: 1, padding: 12, overflowY: "auto", background: "#f9f9f9" }}>
{messages.map((msg) => {
  const isMe = selectedPage?.type === "instagram"
    ? (msg.from?.id === selectedPage.igId)
    : (msg.from?.name === selectedPage?.name);

  const bubbleStyle = {
 display: "inline-block",
  padding: "14px 18px",
  borderRadius: 20,
  backgroundColor: isMe ? "#4caf50" : "#2c2c2c",
  border: isMe ? "1px solid #81c784" : "1px solid #444",
  maxWidth: "75%",
  fontSize: "16px",
  color: "#fff",
  wordBreak: "break-word",
  boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
  };

  return (
    <div
      key={msg.id}
      style={{
        textAlign: isMe ? "right" : "left",
        marginBottom: 10,
      }}
    >
      <div style={bubbleStyle}>
        <strong>{msg.displayName}</strong>
        <div>{msg.message}</div>
        <small>{new Date(msg.created_time).toLocaleString()}</small>
      </div>
    </div>
  );
})}

              </div>
              <div style={{ display: "flex", padding: 12, borderTop: "1px solid #ddd" }}>
<input
  type="text"
  value={newMessage}
  onChange={(e) => setNewMessage(e.target.value)}
  placeholder="Type your message..."
style={{
  width: "22%",
  borderRight: "1px solid #444",
  overflowY: "auto",
  backgroundColor: "#2a2a2a",
  fontSize: "16px",
  color: "#fff",
}}

/>
<Button
  onClick={sendMessage}
  primary
  style={{
    marginLeft: 12,
    borderRadius: 25,
    padding: "10px 20px",
    fontSize: "16px",
  }}
>
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

