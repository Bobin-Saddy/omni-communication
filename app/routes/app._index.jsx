import { useState, useEffect, useRef } from "react";

export default function ChatWidget({ FACEBOOK_APP_ID, WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID }) {
  const [selectedPage, setSelectedPage] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [pageAccessTokens, setPageAccessTokens] = useState({});
  const [fbConnected, setFbConnected] = useState(false);
  const [igConnected, setIgConnected] = useState(false);
  const [waConnected, setWaConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, selectedConversation]);

  // Facebook SDK init
  useEffect(() => {
    window.fbAsyncInit = function () {
      window.FB.init({ appId: FACEBOOK_APP_ID, cookie: true, xfbml: true, version: "v18.0" });
    };
    if (!document.getElementById("facebook-jssdk")) {
      const js = document.createElement("script");
      js.id = "facebook-jssdk";
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      document.body.appendChild(js);
    }
  }, []);

  // Connect FB
  const handleFacebookLogin = () => {
    window.FB.login((res) => {
      if (res.authResponse) fetchFacebookPages(res.authResponse.accessToken);
    }, { scope: "pages_show_list,pages_messaging,pages_read_engagement,pages_manage_posts" });
  };

  const fetchFacebookPages = async (accessToken) => {
    setLoading(true);
    try {
      const res = await fetch(`https://graph.facebook.com/me/accounts?fields=access_token,name,id&access_token=${accessToken}`);
      const data = await res.json();
      const pages = (data.data || []).map(p => ({ ...p, type: "facebook" }));
      const tokens = Object.fromEntries(pages.map(p => [p.id, p.access_token]));
      setPageAccessTokens((prev) => ({ ...prev, ...tokens }));
      setSelectedPage(pages[0]);
      setFbConnected(true);
      fetchConversations(pages[0]);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch Facebook pages");
    } finally { setLoading(false); }
  };

  // Connect WA
  const handleWhatsAppConnect = async () => {
    setWaConnected(true);
    setSelectedPage({ id: "whatsapp", name: "WhatsApp", type: "whatsapp" });
    try {
      const res = await fetch("/get-whatsapp-users");
      const users = await res.json();
      const convs = users.map((u, i) => ({ id: `wa-${i}`, userName: u.name || u.number, userNumber: u.number }));
      setConversations(convs);
    } catch (err) { console.error(err); alert("Failed to fetch WhatsApp users"); }
  };

  // Fetch messages for a conversation
  const fetchMessages = async (conv) => {
    setSelectedConversation(conv);
    if (!conv) return;

    if (selectedPage.type === "whatsapp") {
      try {
        const res = await fetch(`/get-messages?number=${conv.userNumber}`);
        const data = await res.json();
        const backendMessages = (data.messages || []).map((msg, i) => ({
          id: msg.id || `local-${i}`,
          message: msg.content,
          displayName: msg.sender === WHATSAPP_PHONE_NUMBER_ID ? "You" : conv.userName,
          created_time: new Date(msg.timestamp || Date.now()).toISOString(),
          from: { id: msg.sender },
        }));
        setMessages({ [conv.id]: backendMessages });
      } catch (err) { console.error(err); }
      return;
    }

    // Facebook/Instagram messages
    try {
      const token = pageAccessTokens[selectedPage.id];
      const res = await fetch(`https://graph.facebook.com/v18.0/${conv.id}/messages?fields=from,message,created_time&access_token=${token}`);
      const data = await res.json();
      const enriched = (data.data || []).reverse().map(m => ({
        ...m,
        displayName: m.from?.name || "User",
      }));
      setMessages({ [conv.id]: enriched });
    } catch (err) { console.error(err); }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;
    setSending(true);

    try {
      if (selectedPage.type === "whatsapp") {
        const payload = { messaging_product: "whatsapp", to: selectedConversation.userNumber, type: "text", text: { body: newMessage } };
        await fetch(`https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`, { method: "POST", headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}`, "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      } else {
        const token = pageAccessTokens[selectedPage.id];
        const participants = selectedConversation.participants?.data || [];
        const recipient = participants.find(p => p.name !== selectedPage.name);
        await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${token}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipient: { id: recipient.id }, message: { text: newMessage }, messaging_type: "MESSAGE_TAG", tag: "ACCOUNT_UPDATE" }),
        });
      }

      // Add local message
      const localMsg = { id: `local-${Date.now()}`, message: newMessage, displayName: "You", created_time: new Date().toISOString(), from: { id: "me" } };
      setMessages((prev) => ({
        ...prev,
        [selectedConversation.id]: [...(prev[selectedConversation.id] || []), localMsg],
      }));

      setNewMessage("");
      fetchMessages(selectedConversation);
    } catch (err) { console.error(err); }
    finally { setSending(false); }
  };

  return (
    <div style={{ fontFamily: "Arial", width: 400, border: "1px solid #ccc", borderRadius: 8, overflow: "hidden" }}>
      <div style={{ padding: 10, background: "#000", color: "#fff", fontWeight: 600 }}>Chat Widget</div>

      <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 6 }}>
        {!fbConnected && <button onClick={handleFacebookLogin} disabled={loading}>Connect Facebook</button>}
        {!waConnected && <button onClick={handleWhatsAppConnect}>Connect WhatsApp</button>}
      </div>

      {selectedPage && (
        <div style={{ display: "flex", flexDirection: "column", height: 500, borderTop: "1px solid #ccc" }}>
          <div style={{ flex: 1, overflowY: "auto", padding: 10 }}>
            {(messages[selectedConversation?.id] || []).map(msg => {
              const isMe = msg.from?.id === "me" || msg.displayName === "You";
              return (
                <div key={msg.id} style={{ alignSelf: isMe ? "flex-end" : "flex-start", background: isMe ? "#d1e7dd" : "#f0f0f0", padding: 6, marginBottom: 4, borderRadius: 6 }}>
                  <strong>{msg.displayName}</strong>: {msg.message}
                  <div style={{ fontSize: 10, color: "#666" }}>{new Date(msg.created_time).toLocaleTimeString()}</div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <div style={{ display: "flex", padding: 6, borderTop: "1px solid #ccc" }}>
            <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message" style={{ flex: 1, padding: 6 }} onKeyDown={(e) => e.key === "Enter" && sendMessage()} disabled={sending} />
            <button onClick={sendMessage} disabled={sending || !newMessage.trim()} style={{ marginLeft: 4 }}>{sending ? "Sending..." : "Send"}</button>
          </div>
        </div>
      )}
    </div>
  );
}
