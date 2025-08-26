import React, { useState, useEffect, useRef } from "react";

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
  const [loadingConversations, setLoadingConversations] = useState(false);

  const messagesEndRef = useRef(null);
  const FACEBOOK_APP_ID = "544704651303656";

  useEffect(() => {
    // Get shop from URL
    const urlParams = new URLSearchParams(window.location.search);
    const shop = urlParams.get("shop");
  }, []);

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

  // Scroll chat to bottom
  useEffect(() => {
    if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Reset helpers
  const resetFbData = () => {
    setFbPages([]);
    setFbConnected(false);
    if (selectedPage?.type === "facebook") resetSelection();
  };
  const resetIgData = () => {
    setIgPages([]);
    setIgConnected(false);
    if (selectedPage?.type === "instagram") resetSelection();
  };
  const resetSelection = () => {
    setSelectedPage(null);
    setConversations([]);
    setSelectedConversation(null);
    setMessages([]);
  };

  // Facebook Login
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

  // Instagram Login
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

  // Fetch pages (replace with actual API call)
  const fetchFacebookPages = async (accessToken) => {
    // simulate fetching
    const pages = [
      { id: "1", name: "FB Page 1", type: "facebook" },
      { id: "2", name: "FB Page 2", type: "facebook" },
    ];
    setFbPages(pages);
    setFbConnected(true);
    setPageAccessTokens((prev) => ({ ...prev, facebook: accessToken }));
  };

  const fetchInstagramPages = async (accessToken) => {
    const pages = [
      { id: "101", name: "IG Account 1", type: "instagram" },
      { id: "102", name: "IG Account 2", type: "instagram" },
    ];
    setIgPages(pages);
    setIgConnected(true);
    setPageAccessTokens((prev) => ({ ...prev, instagram: accessToken }));
  };

  // Connect a page/account
  const handleConnectPage = async (page) => {
    setSelectedPage(page);
    setLoadingConversations(true);

    // Fetch conversations (replace with actual API call)
    const dummyConversations = [
      { id: 1, name: "User A" },
      { id: 2, name: "User B" },
    ];
    setConversations(dummyConversations);
    setLoadingConversations(false);
  };

  // Fetch messages for a conversation
  const fetchMessages = async (conversation) => {
    setSelectedConversation(conversation);
    const dummyMessages = [
      { id: 1, sender: "user", text: "Hi!" },
      { id: 2, sender: "agent", text: "Hello, how can I help?" },
    ];
    setMessages(dummyMessages);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Social Chat Dashboard</h1>

      {/* Login Buttons */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button onClick={handleFacebookLogin} disabled={fbConnected}>
          Facebook Login
        </button>
        <button onClick={handleInstagramLogin} disabled={igConnected}>
          Instagram Login
        </button>
        <button
          onClick={() =>
            handleConnectPage({ id: "widget", type: "widget", name: "Chat Widget" })
          }
        >
          Chat Widget
        </button>
      </div>

      {/* Show pages */}
      {fbPages.length > 0 && (
        <div>
          <h3>Facebook Pages</h3>
          <ul>
            {fbPages.map((page) => (
              <li key={page.id}>
                {page.name}{" "}
                <button onClick={() => handleConnectPage(page)}>Connect</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {igPages.length > 0 && (
        <div>
          <h3>Instagram Accounts</h3>
          <ul>
            {igPages.map((page) => (
              <li key={page.id}>
                {page.name}{" "}
                <button onClick={() => handleConnectPage(page)}>Connect</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Conversations */}
      {selectedPage && (
        <div style={{ marginTop: 20 }}>
          <h3>Conversations - {selectedPage.name}</h3>
          {loadingConversations ? (
            <p>Loading...</p>
          ) : (
            <ul>
              {conversations.map((conv) => (
                <li
                  key={conv.id}
                  onClick={() => fetchMessages(conv)}
                  style={{ cursor: "pointer", margin: 5 }}
                >
                  {conv.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Messages */}
      {selectedConversation && (
        <div style={{ marginTop: 20 }}>
          <h3>Messages with {selectedConversation.name}</h3>
          <div style={{ border: "1px solid #ccc", padding: 10, minHeight: 200 }}>
            {messages.map((msg) => (
              <p key={msg.id} style={{ textAlign: msg.sender === "agent" ? "right" : "left" }}>
                <strong>{msg.sender}:</strong> {msg.text}
              </p>
            ))}
            <div ref={messagesEndRef}></div>
          </div>
        </div>
      )}
    </div>
  );
}
