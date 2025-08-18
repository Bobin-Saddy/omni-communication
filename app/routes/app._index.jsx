import { useState, useEffect, useRef } from "react";
import { useLoaderData } from "@remix-run/react";

export default function SocialChatDashboard() {
  const [fbPages, setFbPages] = useState([]);
  const [igPages, setIgPages] = useState([]);
  const [fbConnected, setFbConnected] = useState(false);
  const [igConnected, setIgConnected] = useState(false);
  const [waConnected, setWaConnected] = useState(false);
  const [customConnected, setCustomConnected] = useState(false);
  const [selectedPage, setSelectedPage] = useState(null);
  const [pageAccessTokens, setPageAccessTokens] = useState({});
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState({});
  const [newMessage, setNewMessage] = useState("");
  const data = useLoaderData() || { sessions: [] }; // ✅ safe fallback
  const [sessions, setSessions] = useState(data.sessions);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const url = new URL(window.location.href);
        const shop = url.searchParams.get("shop");
        if (!shop) return;

        const res = await fetch(`/admin/chat/list?shop=${shop}`);
        const data = await res.json();
        setSessions(data.sessions || []);
      } catch (err) {
        console.error("Polling error", err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const [loadingPages, setLoadingPages] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  const messagesEndRef = useRef(null);

  const FACEBOOK_APP_ID = "544704651303656";
  const WHATSAPP_TOKEN = "YOUR_WHATSAPP_TOKEN";
  const WHATSAPP_PHONE_NUMBER_ID = "106660072463312";
  const WHATSAPP_RECIPIENT_NUMBER = "919779728764";

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

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const resetFbData = () => {
    setFbPages([]);
    setFbConnected(false);
    if (selectedPage?.type === "facebook") {
      setSelectedPage(null);
      setConversations([]);
      setMessages({});
    }
  };

  const resetIgData = () => {
    setIgPages([]);
    setIgConnected(false);
    if (selectedPage?.type === "instagram") {
      setSelectedPage(null);
      setConversations([]);
      setMessages({});
    }
  };

  const resetCustomData = () => {
    setCustomConnected(false);
    if (selectedPage?.type === "custom") {
      setSelectedPage(null);
      setConversations([]);
      setMessages({});
    }
  };

  const handleFacebookLogin = () => {
    window.FB.login(
      (res) => {
        if (res.authResponse) {
          resetIgData();
          resetCustomData();
          fetchFacebookPages(res.authResponse.accessToken);
        }
      },
      { scope: "pages_show_list,pages_messaging,pages_read_engagement,pages_manage_posts" }
    );
  };

  const handleInstagramLogin = () => {
    window.FB.login(
      (res) => {
        if (res.authResponse) {
          resetFbData();
          resetCustomData();
          fetchInstagramPages(res.authResponse.accessToken);
        }
      },
      { scope: "pages_show_list,instagram_basic,instagram_manage_messages,pages_read_engagement,pages_manage_metadata" }
    );
  };

  const handleWhatsAppConnect = async () => {
    setWaConnected(true);
    setSelectedPage({ id: "whatsapp", name: "WhatsApp", type: "whatsapp" });

    try {
      const res = await fetch("/get-whatsapp-users");
      const users = await res.json();

      const convs = users.map((u, index) => ({
        id: `wa-${index}`,
        userName: u.name || u.number,
        businessName: "You",
        userNumber: u.number,
      }));

      setConversations(convs);
      setMessages({});
      setSelectedConversation(null);
    } catch (error) {
      alert("Failed to fetch WhatsApp users.");
      console.error(error);
    }
  };

  const handleCustomConnect = () => {
    setCustomConnected(true);
    setSelectedPage({ id: "custom", name: "Custom Chat", type: "custom" });

    const convs = [
      { id: "c1", userName: "Alice", businessName: "Custom Chat" },
      { id: "c2", userName: "Bob", businessName: "Custom Chat" },
    ];

    setConversations(convs);
    setMessages({});
    setSelectedConversation(null);
  };

  // ... keep fetchFacebookPages, fetchInstagramPages, fetchConversations, fetchMessages, sendWhatsAppMessage, sendMessage (no changes except messages state is an object)

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-gray-100 p-4 overflow-y-auto">
        <h2 className="text-lg font-bold mb-4">Channels</h2>

        <button onClick={handleFacebookLogin} className="w-full bg-blue-600 text-white p-2 rounded mb-2">
          {fbConnected ? "Reconnect Facebook" : "Connect Facebook"}
        </button>

        <button onClick={handleInstagramLogin} className="w-full bg-pink-600 text-white p-2 rounded mb-2">
          {igConnected ? "Reconnect Instagram" : "Connect Instagram"}
        </button>

        <button onClick={handleWhatsAppConnect} className="w-full bg-green-600 text-white p-2 rounded mb-2">
          {waConnected ? "Reconnect WhatsApp" : "Connect WhatsApp"}
        </button>

        <button onClick={handleCustomConnect} className="w-full bg-purple-600 text-white p-2 rounded mb-2">
          {customConnected ? "Reconnect Custom" : "Connect Custom"}
        </button>

        <h3 className="text-md font-semibold mt-4 mb-2">Conversations</h3>
        <ul>
          {conversations.map((conv) => (
            <li
              key={conv.id}
              className={`p-2 cursor-pointer rounded ${
                selectedConversation?.id === conv.id ? "bg-gray-300" : "hover:bg-gray-200"
              }`}
              onClick={() => fetchMessages(conv)}
            >
              {conv.userName || conv.id}
            </li>
          ))}
        </ul>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-4">
          {(messages[selectedConversation?.id] || []).map((msg, i) => (
            <div key={i} className="mb-2">
              <strong>{msg.displayName || msg.from?.id || "User"}:</strong> {msg.message}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        {selectedConversation && (
          <div className="p-4 border-t flex">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 border rounded p-2 mr-2"
              placeholder="Type a message..."
            />
            <button
              onClick={sendMessage}
              disabled={sendingMessage}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
