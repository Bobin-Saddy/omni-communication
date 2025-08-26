import { useState, useEffect, useRef } from "react";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("settings"); // tab control
  const [fbPages, setFbPages] = useState([]);
  const [igPages, setIgPages] = useState([]);
  const [fbConnected, setFbConnected] = useState(false);
  const [igConnected, setIgConnected] = useState(false);
  const [waConnected, setWaConnected] = useState(false);
  const [widgetConnected, setWidgetConnected] = useState(false);

  const [selectedPage, setSelectedPage] = useState(null);
  const [pageAccessTokens, setPageAccessTokens] = useState({});
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  const [loadingPages, setLoadingPages] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  const messagesEndRef = useRef(null);
  const [currentStoreDomain, setCurrentStoreDomain] = useState(null);

  const FACEBOOK_APP_ID = "544704651303656";
  const WHATSAPP_TOKEN =
    "EAAHvZAZB8ZCmugBPFAoZAF4Gv01xG9ZCpwHQbmRpNbBM8q1HsSiiRODdClpCNjNM2yTE6jJhm3rOonkbvURHHaEH8svAGiCF9dFKqdqRuC18yhZBxxDZCgpAxZAPfHzgTcJXILmGK9xNyxaStGF9E8gDOKLsw4gkeumEwJOBHc7u1kfJxifWgtkChCmO77ZBdlkF1ZBooZAKVJEvOiTuybHb2Clc0oaMseMxyxPq7ymrAIMTAZDZD";
  const WHATSAPP_PHONE_NUMBER_ID = "106660072463312";

  // -----------------------------
  // On mount: get current store
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const shop = urlParams.get("shop");
    if (shop) setCurrentStoreDomain(shop);
  }, []);

  // -----------------------------
  // Initialize Facebook SDK
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

  // Scroll messages to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // -----------------------------
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

  // -----------------------------
  // Login / Connect functions
  const handleFacebookLogin = () => {
    window.FB.login(
      (res) => {
        if (res.authResponse) {
          resetIgData();
          fetchFacebookPages(res.authResponse.accessToken).then((pages) => {
            if (pages && pages.length > 0) {
              setSelectedPage({ ...pages[0], type: "facebook" });
              fetchConversations(pages[0]);
            }
            setFbConnected(true);
          });
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
          fetchInstagramPages(res.authResponse.accessToken).then((pages) => {
            if (pages && pages.length > 0) {
              setSelectedPage({ ...pages[0], type: "instagram" });
              fetchConversations(pages[0]);
            }
            setIgConnected(true);
          });
        }
      },
      {
        scope:
          "pages_show_list,instagram_basic,instagram_manage_messages,pages_read_engagement,pages_manage_metadata",
      }
    );
  };

  const handleWidgetConnect = async () => {
    try {
      setLoadingConversations(true);
      const res = await fetch(`/api/chat?widget=true`);
      if (!res.ok) throw new Error("Failed to fetch widget sessions");

      const data = await res.json();
      setConversations(data.sessions || []);
      setSelectedPage({ id: "widget", type: "widget", name: "Chat Widget" });
      setWidgetConnected(true);
    } catch (err) {
      console.error("Widget connect failed:", err);
    } finally {
      setLoadingConversations(false);
    }
  };

  const handleWhatsAppConnect = async () => {
    try {
      const res = await fetch("/get-whatsapp-users");
      const users = await res.json(); // [{ number, name }]
      const convs = users.map((u, index) => ({
        id: `wa-${index}`,
        userName: u.name || u.number,
        businessName: "You",
        userNumber: u.number,
      }));
      setConversations(convs);
      setMessages([]);
      setSelectedConversation(null);
      setSelectedPage({ id: "whatsapp", name: "WhatsApp", type: "whatsapp" });
      setWaConnected(true);
    } catch (error) {
      alert("Failed to fetch WhatsApp users.");
      console.error(error);
    }
  };

  // -----------------------------
  // Fetch pages
  const fetchFacebookPages = async (accessToken) => {
    setLoadingPages(true);
    try {
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
    } catch (error) {
      alert("Error fetching Facebook pages.");
      console.error(error);
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

      const igPages = data.data.filter((p) => p.instagram_business_account);
      if (!igPages.length) {
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
      setConversations([]);
    } catch (error) {
      alert("Error fetching Instagram pages.");
      console.error(error);
    } finally {
      setLoadingPages(false);
    }
  };

  // -----------------------------
  // Fetch conversations
  const fetchConversations = async (page) => {
    setLoadingConversations(true);
    try {
      const token = pageAccessTokens[page.id];
      setSelectedPage(page);
      setSelectedConversation(null);
      setMessages([]);

      const url =
        page.type === "instagram"
          ? `https://graph.facebook.com/v18.0/${page.id}/conversations?platform=instagram&fields=participants&access_token=${token}`
          : `https://graph.facebook.com/v18.0/${page.id}/conversations?fields=participants&access_token=${token}`;

      const res = await fetch(url);
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
            const userName = otherMsg?.from?.name || "Instagram User";

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
    } catch (error) {
      alert("Error fetching conversations.");
      console.error(error);
    } finally {
      setLoadingConversations(false);
    }
  };

  // -----------------------------
  // Fetch messages
  const fetchMessages = async (conv) => {
    // similar to your original fetchMessages function
    // include logic for widget, WhatsApp, FB, Instagram here
  };

  // -----------------------------
  // Send messages
  const sendMessage = async () => {
    // include your original sendMessage function
  };

  const sendWhatsAppMessage = async () => {
    // include your original sendWhatsAppMessage function
  };

  // -----------------------------
  return (
    <div>
      {/* Render UI here */}
      <h1>Settings / Social Chat</h1>

      <button onClick={handleFacebookLogin}>
        {fbConnected ? "FB Connected" : "Connect Facebook"}
      </button>
      <button onClick={handleInstagramLogin}>
        {igConnected ? "IG Connected" : "Connect Instagram"}
      </button>
      <button onClick={handleWhatsAppConnect}>
        {waConnected ? "WhatsApp Connected" : "Connect WhatsApp"}
      </button>
      <button onClick={handleWidgetConnect}>
        {widgetConnected ? "Widget Connected" : "Connect Widget"}
      </button>

      <div>
        <h2>Conversations</h2>
        {loadingConversations
          ? "Loading..."
          : conversations.map((conv) => (
              <div key={conv.id} onClick={() => fetchMessages(conv)}>
                {conv.userName || conv.id}
              </div>
            ))}
      </div>

      <div>
        <h2>Messages</h2>
        {(selectedConversation &&
          messages[selectedConversation.id])?.map((msg) => (
          <div key={msg.id}>
            <b>{msg.displayName || "User"}:</b> {msg.message}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}
