import { useState, useEffect, useRef } from "react";

export default function SocialChatDashboard() {
  const [activeTab, setActiveTab] = useState("settings");
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
  const [widgetConnected, setWidgetConnected] = useState(false);

  const [loadingPages, setLoadingPages] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  const messagesEndRef = useRef(null);

  const FACEBOOK_APP_ID = "544704651303656";
  const WHATSAPP_TOKEN = "EAAHvZAZB8ZCmugBPPcWtoSpR6v6t8KZAQparjK3EKwr1nQK2wiVwtSRM2o9MuDCe0GuyexCj0ojTzAWN4CB4ZAhopUtk7uFv4CQU7TOIxxdZC2YUv8IMWIf5TTqUTtFvmknzRMe2IwN3zGfP6piVHSvYZCiCGwkI6xmvYK0gzQiKhA7aCZBZCo3Lvsv4DNHYjPk1N9T1gXxv8I0r7sErm28Rq9l0UcIB8FtUUZCgIeMPSnjAZDZD";
  const WHATSAPP_PHONE_NUMBER_ID = "106660072463312";

  const [currentStoreDomain, setCurrentStoreDomain] = useState(null);

  // Get shop from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const shop = urlParams.get("shop");
    if (shop) setCurrentStoreDomain(shop);
  }, []);

  // Init FB SDK
  useEffect(() => {
    window.fbAsyncInit = function () {
      window.FB.init({
        appId: FACEBOOK_APP_ID,
        cookie: true,
        xfbml: true,
        version: "v18.0",
      });
    };

    if (!document.getElementById("facebook-jssdk")) {
      const js = document.createElement("script");
      js.id = "facebook-jssdk";
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      document.body.appendChild(js);
    }
  }, []);

  // Scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Reset functions
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

  // Fetch Pages
  const fetchFacebookPages = async (accessToken) => {
    setLoadingPages(true);
    try {
      const res = await fetch(
        `https://graph.facebook.com/me/accounts?fields=access_token,name,id&access_token=${accessToken}`
      );
      const data = await res.json();
      if (!Array.isArray(data.data)) return;

      const tokens = {};
      const pages = data.data.map((p) => {
        tokens[p.id] = p.access_token;
        return { ...p, type: "facebook" };
      });

      setPageAccessTokens((prev) => ({ ...prev, ...tokens }));
      setFbPages(pages);
      setFbConnected(true);
      setSelectedPage(pages[0]);
      await fetchConversations(pages[0]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPages(false);
    }
  };

  const fetchInstagramPages = async (accessToken) => {
    setLoadingPages(true);
    try {
      const res = await fetch(
        `https://graph.facebook.com/me/accounts?fields=access_token,name,id,instagram_business_account&access_token=${accessToken}`
      );
      const data = await res.json();
      const igPages = data.data?.filter((p) => p.instagram_business_account) || [];
      if (!igPages.length) return;

      const tokens = {};
      const enriched = igPages.map((p) => {
        tokens[p.id] = p.access_token;
        return { ...p, type: "instagram", igId: p.instagram_business_account.id };
      });

      setPageAccessTokens((prev) => ({ ...prev, ...tokens }));
      setIgPages(enriched);
      setIgConnected(true);
      setSelectedPage(enriched[0]);
      setConversations([]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPages(false);
    }
  };

  // Fetch Conversations
  const fetchConversations = async (page) => {
    if (!pageAccessTokens[page.id]) return;
    setLoadingConversations(true);
    try {
      const token = pageAccessTokens[page.id];
      const url = `https://graph.facebook.com/v18.0/${page.id}/conversations?fields=id,participants,messages{from,message,created_time},messaging_product&access_token=${token}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!Array.isArray(data.data)) return;

      const convs = data.data.map((c) => ({
        id: c.id,
        pageId: page.id,
        pageName: page.name,
        pageType: c.messaging_product === "instagram" ? "instagram" : "facebook",
        participants: c.participants,
        messages: c.messages?.data?.reverse() || [],
      }));

      setConversations(convs);
    } catch (err) {
      console.error(err);
      alert("Error fetching conversations.");
    } finally {
      setLoadingConversations(false);
    }
  };

  // Fetch messages for selected conversation
  const fetchMessages = async (conv) => {
    if (!conv) return;
    setSelectedConversation(conv);
    setMessages({ [conv.id]: conv.messages || [] });
  };

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !selectedPage) return;

    const token = pageAccessTokens[selectedPage.id];
    const recipient =
      selectedPage.type === "instagram"
        ? selectedConversation.participants.data.find((p) => p.id !== selectedPage.igId)
        : selectedConversation.participants.data.find((p) => p.name !== selectedPage.name);

    if (!recipient) return alert("Recipient not found");

    try {
      await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: { id: recipient.id },
          message: { text: newMessage },
          messaging_product: selectedPage.type === "instagram" ? "instagram" : undefined,
        }),
      });

      setMessages((prev) => ({
        ...prev,
        [selectedConversation.id]: [
          ...(prev[selectedConversation.id] || []),
          { id: "local-" + Date.now(), from: { name: "You" }, message: newMessage },
        ],
      }));
      setNewMessage("");
    } catch (err) {
      console.error(err);
      alert("Failed to send message");
    }
  };

  return (
    <div style={{ display: "flex", height: "90vh", border: "1px solid #ddd" }}>
      {/* Conversations list */}
      <div style={{ width: "30%", borderRight: "1px solid #ddd", padding: 10 }}>
        <h3>Conversations</h3>
        {conversations.length === 0 ? (
          <p>No conversations</p>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.id}
              style={{
                padding: 8,
                cursor: "pointer",
                background: selectedConversation?.id === conv.id ? "#eee" : "transparent",
              }}
              onClick={() => fetchMessages(conv)}
            >
              <b>[{conv.pageName}]</b>{" "}
              {conv.participants?.data?.map((p) => p.name).join(", ")}
            </div>
          ))
        )}
      </div>

      {/* Chat box */}
      <div style={{ flex: 1, padding: 10, display: "flex", flexDirection: "column" }}>
        <h3>
          Chat:{" "}
          {selectedConversation
            ? selectedConversation.participants.data.map((p) => p.name).join(", ")
            : "Select a conversation"}
        </h3>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            border: "1px solid #ccc",
            marginBottom: 10,
            padding: 10,
          }}
        >
          {selectedConversation &&
          messages[selectedConversation.id] &&
          messages[selectedConversation.id].length ? (
            messages[selectedConversation.id].map((msg) => (
              <div key={msg.id} style={{ marginBottom: 8 }}>
                <b>{msg.from?.name || msg.from?.username}:</b> {msg.message}{" "}
                <small>{msg.created_time || ""}</small>
              </div>
            ))
          ) : (
            <p>No messages yet.</p>
          )}
          <div ref={messagesEndRef}></div>
        </div>

        {selectedConversation && (
          <div style={{ display: "flex" }}>
            <input
              type="text"
              placeholder="Type a message..."
              style={{ flex: 1, padding: 8 }}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button onClick={sendMessage}>Send</button>
          </div>
        )}
      </div>
    </div>
  );
}
