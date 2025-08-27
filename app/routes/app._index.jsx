import { useContext, useEffect, useRef, useState } from "react";
import { AppContext } from "./AppContext";

export default function SocialChatDashboard() {
  const {
    connectedPages,
    setConnectedPages,
    selectedPage,
    setSelectedPage,
    conversations,
    setConversations,
    messages,
    setMessages,
  } = useContext(AppContext);

  const [activeTab, setActiveTab] = useState("settings");
  const [fbPages, setFbPages] = useState([]);
  const [igPages, setIgPages] = useState([]);
  const [pageAccessTokens, setPageAccessTokens] = useState({});
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  const FACEBOOK_APP_ID = "544704651303656";

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

  // Fetch conversations for selected page
  const fetchConversations = async (page) => {
    if (!page) return;
    const token = page.access_token || pageAccessTokens[page.id];
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
          const otherMsg = msgData.data.find((m) => m.from?.id !== page.igId);
          return {
            ...conv,
            userName: otherMsg?.from?.name || "Instagram User",
            businessName: page.name,
          };
        })
      );
      setConversations(enriched);
    } else {
      setConversations(data.data || []);
    }
  };

  // Fetch messages for selected conversation
  const fetchMessages = (conv) => {
    if (!conv) return;
    setMessages({ [conv.id]: conv.messages || [] });
  };

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedPage) return;
    const token = pageAccessTokens[selectedPage.id];
    alert("Implement send message logic here...");
  };

  return (
    <div style={{ display: "flex", height: "90vh", border: "1px solid #ddd" }}>
      {/* Conversations list */}
      <div style={{ width: "30%", borderRight: "1px solid #ddd", padding: 10 }}>
        <h3>Connected Pages</h3>
        {connectedPages.length === 0 ? (
          <p>No connected pages</p>
        ) : (
          connectedPages.map((p) => (
            <div
              key={p.id}
              style={{ padding: 8, cursor: "pointer" }}
              onClick={() => fetchConversations(p)}
            >
              <b>{p.name}</b> ({p.type})
            </div>
          ))
        )}
      </div>

      {/* Chat box */}
      <div style={{ flex: 1, padding: 10, display: "flex", flexDirection: "column" }}>
        <h3>
          Chat: {selectedPage ? selectedPage.name : "Select a connected page"}
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
          {selectedPage && messages[selectedPage.id] ? (
            messages[selectedPage.id].map((msg) => (
              <div key={msg.id} style={{ marginBottom: 8 }}>
                <b>{msg.from?.name || msg.from?.username}:</b> {msg.message}
              </div>
            ))
          ) : (
            <p>No messages yet.</p>
          )}
          <div ref={messagesEndRef}></div>
        </div>
        {selectedPage && (
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
