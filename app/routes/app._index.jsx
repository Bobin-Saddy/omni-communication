import { useState, useEffect, useRef } from "react";

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
  
  // Store messages per conversation ID
  const [conversationMessages, setConversationMessages] = useState({});

  const [newMessage, setNewMessage] = useState("");
  const [loadingPages, setLoadingPages] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  const messagesEndRef = useRef(null);

  const FACEBOOK_APP_ID = "544704651303656";
  const WHATSAPP_TOKEN = "EAAHvZAZB8ZCmugBPKJxE3N6W9BacCsuupbdraq8VbT7nhN7rCSra9N6suFzc9dDc2bAQhq8ZCUfjY87WHu8NU5MRJytzZCzQp2DW68fMdbSZAaxrElMiP1nAI04AzkKvq0fWIwP9XnjBGoD7gK7KbJ6lgP3DxgVZAfp47TNN6ZBBfLQQoUjCq9W7UP5nxDQEQchbhHq68hPF1bwUIMpWRmlWedFXxAWjK047INQMjIE9FVA4";
  const WHATSAPP_PHONE_NUMBER_ID = "106660072463312";

  // Load Facebook SDK once on mount
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

  // Scroll chat window to bottom when messages update or selectedConversation changes
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedConversation, conversationMessages]);

  // Reset Facebook data if Instagram connected and vice versa
  const resetFbData = () => {
    setFbPages([]);
    setFbConnected(false);
    if (selectedPage?.type === "facebook") {
      setSelectedPage(null);
      setConversations([]);
      setConversationMessages({});
      setSelectedConversation(null);
    }
  };

  const resetIgData = () => {
    setIgPages([]);
    setIgConnected(false);
    if (selectedPage?.type === "instagram") {
      setSelectedPage(null);
      setConversations([]);
      setConversationMessages({});
      setSelectedConversation(null);
    }
  };

  // Facebook Login and fetch pages
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

  // Instagram Login and fetch pages
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

  // WhatsApp connect (fetch users for WhatsApp conversations)
  const handleWhatsAppConnect = async () => {
    setWaConnected(true);
    setSelectedPage({ id: "whatsapp", name: "WhatsApp", type: "whatsapp" });

    try {
      const res = await fetch("/get-whatsapp-users");
      const users = await res.json(); // [{ number: "919876543210", name: "John" }, ...]

      const convs = users.map((u, index) => ({
        id: `wa-${index}`,
        userName: u.name || u.number,
        businessName: "You",
        userNumber: u.number,
        type: "whatsapp",
      }));

      setConversations(convs);
      setConversationMessages({});
      setSelectedConversation(null);
    } catch (error) {
      alert("Failed to fetch WhatsApp users.");
      console.error(error);
    }
  };

  // Fetch Facebook Pages API call
  const fetchFacebookPages = async (accessToken) => {
    setLoadingPages(true);
    try {
      const res = await fetch(
        `https://graph.facebook.com/me/accounts?fields=access_token,name,id&access_token=${accessToken}`
      );
      const data = await res.json();

      if (!Array.isArray(data?.data) || data.data.length === 0) {
        alert("No Facebook pages found.");
        setLoadingPages(false);
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

  // Fetch Instagram Pages API call
  const fetchInstagramPages = async (accessToken) => {
    setLoadingPages(true);
    try {
      const res = await fetch(
        `https://graph.facebook.com/me/accounts?fields=access_token,name,id,instagram_business_account&access_token=${accessToken}`
      );
      const data = await res.json();

      if (!Array.isArray(data?.data)) {
        alert("Instagram account response is invalid.");
        setLoadingPages(false);
        return;
      }

      const igPages = data.data.filter((p) => p.instagram_business_account);
      if (igPages.length === 0) {
        alert("No Instagram business accounts found.");
        setLoadingPages(false);
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
      setConversationMessages({});
      setSelectedConversation(null);
    } catch (error) {
      alert("Error fetching Instagram pages.");
      console.error(error);
    } finally {
      setLoadingPages(false);
    }
  };

  // Fetch conversations for selected page
  const fetchConversations = async (page) => {
    setLoadingConversations(true);
    try {
      const token = pageAccessTokens[page.id];
      setSelectedPage(page);
      setSelectedConversation(null);
      setConversationMessages({});

      const url = `https://graph.facebook.com/v18.0/${page.id}/conversations?${
        page.type === "instagram" ? "platform=instagram&" : ""
      }fields=participants&access_token=${token}`;

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
    } catch (error) {
      alert("Error fetching conversations.");
      console.error(error);
    } finally {
      setLoadingConversations(false);
    }
  };

  // Fetch messages for conversation
  const fetchMessages = async (conv) => {
    if (!conv) return;

    setSelectedConversation(conv);

    if (conv.type === "whatsapp" || conv.userNumber) {
      // WhatsApp backend messages fetch
      try {
        const res = await fetch(`/get-messages?number=${conv.userNumber}`);
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const data = await res.json();

        const backendMessages = (data.messages || []).map((msg) => ({
          id: msg.id,
          from: { id: msg.sender || "unknown" },
          message: msg.content || "",
          created_time:
            msg.createdAt ||
            (msg.timestamp ? new Date(msg.timestamp * 1000).toISOString() : new Date().toISOString()),
        }));

        setConversationMessages((prev) => ({
          ...prev,
          [conv.id]: backendMessages,
        }));
      } catch (err) {
        alert("Failed to fetch WhatsApp messages.");
        console.error(err);
      }
      return;
    }

    // Facebook/Instagram messages fetch
    try {
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
              conv.userName || msg.from?.name || msg.from?.username || `Instagram User #${msg.from?.id?.slice(-4)}`;
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

      setConversationMessages((prev) => ({
        ...prev,
        [conv.id]: enrichedMessages,
      }));
    } catch (error) {
      alert("Error fetching messages.");
      console.error(error);
    }
  };

  // Send WhatsApp message
  const sendWhatsAppMessage = async () => {
    if (!selectedConversation?.userNumber) return alert("Select a WhatsApp user first");
    if (!newMessage.trim()) return;

    setSendingMessage(true);
    try {
      const payload = {
        messaging_product: "whatsapp",
        to: selectedConversation.userNumber,
        type: "text",
        text: { body: newMessage },
      };

      const res = await fetch(
        `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${WHATSAPP_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();

      // Save message in backend
      await fetch("/save-whatsapp-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: selectedConversation.userNumber,
          from: WHATSAPP_PHONE_NUMBER_ID,
          message: newMessage,
          direction: "outgoing",
        }),
      });

      // Add the sent message locally
      const localMsg = {
        id: "local-" + Date.now().toString(),
        displayName: "You",
        message: newMessage,
        created_time: new Date().toISOString(),
        from: { id: "me" },
      };

      setConversationMessages((prev) => {
        const oldMessages = prev[selectedConversation.id] || [];
        return {
          ...prev,
          [selectedConversation.id]: [...oldMessages, localMsg],
        };
      });

      setNewMessage("");
      await fetchMessages(selectedConversation);
    } catch (error) {
      alert("Failed to send WhatsApp message.");
      console.error(error);
    } finally {
      setSendingMessage(false);
    }
  };

  // Send Facebook or Instagram message
  const sendFacebookMessage = async () => {
    if (!selectedConversation) return alert("Select a conversation first");
    if (!newMessage.trim()) return;

    setSendingMessage(true);
    try {
      const token = pageAccessTokens[selectedPage.id];
      const payload = {
        messaging_type: "RESPONSE",
        message: { text: newMessage },
      };

      const res = await fetch(
        `https://graph.facebook.com/v18.0/${selectedConversation.id}/messages?access_token=${token}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();

      // Add local message for UI
      const localMsg = {
        id: "local-" + Date.now().toString(),
        displayName: "You",
        message: newMessage,
        created_time: new Date().toISOString(),
        from: { id: "me" },
      };

      setConversationMessages((prev) => {
        const oldMessages = prev[selectedConversation.id] || [];
        return {
          ...prev,
          [selectedConversation.id]: [...oldMessages, localMsg],
        };
      });

      setNewMessage("");
      await fetchMessages(selectedConversation);
    } catch (error) {
      alert("Failed to send message.");
      console.error(error);
    } finally {
      setSendingMessage(false);
    }
  };

  // General send message dispatcher
  const sendMessage = async () => {
    if (sendingMessage || !newMessage.trim()) return;

    if (!selectedConversation) return alert("Select a conversation first");

    if (selectedConversation.type === "whatsapp") {
      await sendWhatsAppMessage();
    } else {
      await sendFacebookMessage();
    }
  };

  const currentMessages = selectedConversation
    ? conversationMessages[selectedConversation.id] || []
    : [];

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Sidebar */}
      <div style={{ width: 300, borderRight: "1px solid #ddd", padding: 10, overflowY: "auto" }}>
        <h2>Connect</h2>
        <button onClick={handleFacebookLogin} disabled={fbConnected}>
          {fbConnected ? "Facebook Connected" : "Connect Facebook"}
        </button>
        <button onClick={handleInstagramLogin} disabled={igConnected}>
          {igConnected ? "Instagram Connected" : "Connect Instagram"}
        </button>
        <button onClick={handleWhatsAppConnect} disabled={waConnected}>
          {waConnected ? "WhatsApp Connected" : "Connect WhatsApp"}
        </button>

        {/* Pages */}
        <div>
          <h3>Pages</h3>
          {loadingPages && <p>Loading pages...</p>}
          {fbPages.length > 0 &&
            fbPages.map((page) => (
              <div key={page.id}>
                <button
                  style={{
                    backgroundColor: selectedPage?.id === page.id ? "#cee4fd" : "white",
                    width: "100%",
                    textAlign: "left",
                    marginBottom: 5,
                  }}
                  onClick={() => fetchConversations(page)}
                >
                  {page.name} (Facebook)
                </button>
              </div>
            ))}
          {igPages.length > 0 &&
            igPages.map((page) => (
              <div key={page.id}>
                <button
                  style={{
                    backgroundColor: selectedPage?.id === page.id ? "#cee4fd" : "white",
                    width: "100%",
                    textAlign: "left",
                    marginBottom: 5,
                  }}
                  onClick={() => fetchConversations(page)}
                >
                  {page.name} (Instagram)
                </button>
              </div>
            ))}
          {waConnected && (
            <div>
              <button
                style={{
                  backgroundColor: selectedPage?.id === "whatsapp" ? "#cee4fd" : "white",
                  width: "100%",
                  textAlign: "left",
                  marginBottom: 5,
                }}
                onClick={() => {
                  setSelectedPage({ id: "whatsapp", name: "WhatsApp", type: "whatsapp" });
                  setConversations((prev) => prev);
                  setSelectedConversation(null);
                }}
              >
                WhatsApp
              </button>
            </div>
          )}
        </div>

        {/* Conversations */}
        <div style={{ marginTop: 20 }}>
          <h3>Conversations</h3>
          {loadingConversations && <p>Loading conversations...</p>}
          {conversations.length === 0 && <p>No conversations found</p>}
          {conversations.map((conv) => (
            <div key={conv.id}>
              <button
                style={{
                  backgroundColor: selectedConversation?.id === conv.id ? "#a6d4fa" : "white",
                  width: "100%",
                  textAlign: "left",
                  marginBottom: 5,
                }}
                onClick={() => fetchMessages(conv)}
              >
                {conv.userName || conv.name || conv.userNumber || conv.id}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: 10,
          backgroundColor: "#f5f5f5",
        }}
      >
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: 10,
            backgroundColor: "white",
            borderRadius: 6,
            marginBottom: 10,
          }}
        >
          {!selectedConversation && <p>Select a conversation to view messages.</p>}

          {selectedConversation &&
            currentMessages.map((msg) => {
              const fromId = msg.from?.id || msg.from;
              const isMe = fromId === "me";

              return (
                <div
                  key={msg.id}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: isMe ? "flex-end" : "flex-start",
                    marginBottom: 10,
                  }}
                >
                  <div
                    style={{
                      backgroundColor: isMe ? "#daf8cb" : "#eee",
                      padding: 8,
                      borderRadius: 10,
                      maxWidth: "70%",
                      wordWrap: "break-word",
                    }}
                  >
                    <strong>{isMe ? "You" : msg.displayName || "User"}</strong>
                    <div>{msg.message}</div>
                    <small style={{ fontSize: 10, color: "#555" }}>
                      {new Date(msg.created_time).toLocaleString()}
                    </small>
                  </div>
                </div>
              );
            })}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div style={{ display: "flex" }}>
          <input
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            style={{ flex: 1, padding: 8, fontSize: 16 }}
          />
          <button
            onClick={sendMessage}
            disabled={sendingMessage || !newMessage.trim()}
            style={{ padding: "8px 16px", marginLeft: 5 }}
          >
            {sendingMessage ? "Sending..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
