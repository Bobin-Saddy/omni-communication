import { useState, useEffect } from "react";

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

  // ✅ NEW STATE for dynamic WhatsApp
  const [waPhoneNumberId, setWaPhoneNumberId] = useState("");
  const [waToken, setWaToken] = useState("");
  const [waRecipientNumber, setWaRecipientNumber] = useState("");

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

  const handleWhatsAppConnect = () => {
    if (!waPhoneNumberId || !waToken || !waRecipientNumber) {
      alert("Please fill WhatsApp credentials.");
      return;
    }

    setWaConnected(true);
    setSelectedPage({
      id: "whatsapp",
      name: "WhatsApp",
      type: "whatsapp",
    });
    setConversations([
      {
        id: "wa-1",
        userName: "WhatsApp User",
        businessName: "You",
      },
    ]);
    setMessages([]);
  };

  const fetchMessages = async (conv) => {
    if (!selectedPage) return;

    const token = pageAccessTokens[selectedPage.id];

    if (selectedPage.type === "whatsapp") {
      setSelectedConversation(conv);

      try {
        const res = await fetch(
          `https://graph.facebook.com/v18.0/${waPhoneNumberId}/messages?access_token=${waToken}`
        );
        const data = await res.json();

        const formatted = (data.data || [])
          .filter((msg) => msg.type === "text")
          .map((msg) => ({
            id: msg.id,
            displayName: msg.from === waRecipientNumber ? "WhatsApp User" : "You",
            message: msg.text?.body || "",
            created_time: msg.timestamp ? new Date(Number(msg.timestamp) * 1000).toISOString() : new Date().toISOString(),
            from: { id: msg.from === waRecipientNumber ? "user" : "me" },
          }));

        setMessages(formatted.reverse());
      } catch (error) {
        console.error("Failed to fetch WhatsApp messages", error);
        setMessages([]);
      }

      return;
    }

    // ... other platform fetch logic (Facebook/Instagram)
    // [UNCHANGED]
  };

  const sendWhatsAppMessage = async () => {
    const payload = {
      messaging_product: "whatsapp",
      to: waRecipientNumber,
      type: "text",
      text: { body: newMessage },
    };

    const res = await fetch(
      `https://graph.facebook.com/v18.0/${waPhoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${waToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await res.json();
    console.log("WhatsApp send response", data);
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        displayName: "You",
        message: newMessage,
        created_time: new Date().toISOString(),
        from: { id: "me" },
      },
    ]);
    setNewMessage("");
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedPage || !selectedConversation) return;

    if (selectedPage.type === "whatsapp") {
      await sendWhatsAppMessage();
      return;
    }

    // ... rest of Facebook / Instagram sending logic
    // [UNCHANGED]

    setNewMessage("");
    fetchMessages(selectedConversation);
  };

  return (
    <div className="social-chat-dashboard">
      <div className="page-title">
        <h1>📱 Social Chat Dashboard</h1>
      </div>

      <div className="card for-box">
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <button
            onClick={handleFacebookLogin}
            style={{ backgroundColor: "#000", color: "white", padding: "10px", border: "none", borderRadius: "4px", fontSize: "16px", fontWeight: "500" }}
            disabled={fbConnected}
          >
            Connect Facebook
          </button>

          <div style={{ marginTop: 10 }}>
            <button
              onClick={handleInstagramLogin}
              style={{ backgroundColor: "#000", color: "white", padding: "10px", border: "none", borderRadius: "4px", fontSize: "16px", fontWeight: "500" }}
              disabled={igConnected}
            >
              Connect Instagram
            </button>
          </div>

          {/* ✅ NEW WhatsApp Input Fields */}
          <div style={{ marginTop: 20 }}>
            <input
              placeholder="Phone Number ID"
              value={waPhoneNumberId}
              onChange={(e) => setWaPhoneNumberId(e.target.value)}
              style={{ padding: 8, marginBottom: 5, width: "80%" }}
            />
            <input
              placeholder="Recipient Phone Number"
              value={waRecipientNumber}
              onChange={(e) => setWaRecipientNumber(e.target.value)}
              style={{ padding: 8, marginBottom: 5, width: "80%" }}
            />
            <input
              placeholder="WhatsApp Access Token"
              value={waToken}
              onChange={(e) => setWaToken(e.target.value)}
              style={{ padding: 8, marginBottom: 5, width: "80%" }}
            />
            <button
              onClick={handleWhatsAppConnect}
              disabled={waConnected}
              style={{ backgroundColor: "#000", color: "white", padding: "10px", border: "none", borderRadius: "4px", fontSize: "16px", fontWeight: "500", marginTop: 5 }}
            >
              Connect WhatsApp
            </button>
          </div>
        </div>

        {/* Rest of your component remains unchanged (pages, conversations, chat, etc.) */}
        {/* [NO CHANGE REQUIRED BELOW UNLESS ADDING FEATURES] */}
        
        {/* ... [Your existing UI rendering code] ... */}
      </div>
    </div>
  );
}
