import { useState, useEffect } from "react";

export default function SocialChatDashboard() {
  const [waPhoneNumberId, setWaPhoneNumberId] = useState("");
  const [waToken, setWaToken] = useState("");
  const [waInputNumber, setWaInputNumber] = useState("");
  const [waRecipientNumber, setWaRecipientNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [waConnected, setWaConnected] = useState(false);
  const [selectedPage, setSelectedPage] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  // Dummy OTP sending function (replace with real API)
  const sendOtpToPhone = () => {
    if (!waInputNumber) {
      alert("Please enter phone number");
      return;
    }

    // Simulate sending OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(otpCode);
    alert(`OTP sent to ${waInputNumber}: ${otpCode}`); // Show OTP for testing
  };

  const verifyOtp = () => {
    if (otp === generatedOtp) {
      setWaRecipientNumber(waInputNumber);
      setWaConnected(true);
      setSelectedPage({
        id: "whatsapp",
        name: "WhatsApp",
        type: "whatsapp",
      });
      setConversations([
        {
          id: "wa-1",
          userName: "Verified WhatsApp User",
          businessName: "You",
        },
      ]);
      setMessages([]);
      alert("OTP Verified!");
    } else {
      alert("Invalid OTP");
    }
  };

  const fetchMessages = async (conv) => {
    if (!selectedPage || selectedPage.type !== "whatsapp") return;

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
          displayName: msg.from === waRecipientNumber ? "User" : "You",
          message: msg.text?.body || "",
          created_time: msg.timestamp
            ? new Date(Number(msg.timestamp) * 1000).toISOString()
            : new Date().toISOString(),
          from: { id: msg.from === waRecipientNumber ? "user" : "me" },
        }));

      setMessages(formatted.reverse());
    } catch (error) {
      console.error("Failed to fetch WhatsApp messages", error);
      setMessages([]);
    }
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

  return (
    <div style={{ padding: 30 }}>
      <h2>📱 WhatsApp OTP Chat</h2>

      <div style={{ marginBottom: 20 }}>
        <input
          placeholder="Phone Number ID"
          value={waPhoneNumberId}
          onChange={(e) => setWaPhoneNumberId(e.target.value)}
          style={{ padding: 8, marginBottom: 5, width: "300px" }}
        />
        <br />
        <input
          placeholder="Access Token"
          value={waToken}
          onChange={(e) => setWaToken(e.target.value)}
          style={{ padding: 8, marginBottom: 5, width: "300px" }}
        />
        <br />
        <input
          placeholder="Recipient Phone Number"
          value={waInputNumber}
          onChange={(e) => setWaInputNumber(e.target.value)}
          style={{ padding: 8, marginBottom: 5, width: "300px" }}
        />
        <br />
        <button onClick={sendOtpToPhone} style={{ marginRight: 10 }}>
          Send OTP
        </button>
        <input
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          style={{ padding: 8, marginRight: 10, width: "100px" }}
        />
        <button onClick={verifyOtp}>Verify OTP</button>
      </div>

      {waConnected && (
        <div style={{ border: "1px solid #ccc", padding: 10, borderRadius: 8 }}>
          <h4>Connected to WhatsApp</h4>

          <div>
            <h5>Conversations</h5>
            {conversations.map((conv) => (
              <div
                key={conv.id}
                style={{
                  padding: 8,
                  borderBottom: "1px solid #eee",
                  cursor: "pointer",
                }}
                onClick={() => fetchMessages(conv)}
              >
                {conv.userName}
              </div>
            ))}
          </div>

          <div style={{ marginTop: 20 }}>
            <h5>Messages</h5>
            <div style={{ maxHeight: 200, overflowY: "auto", marginBottom: 10 }}>
              {messages.map((msg) => (
                <div key={msg.id} style={{ marginBottom: 10 }}>
                  <strong>{msg.displayName}:</strong> {msg.message}
                  <br />
                  <small>{new Date(msg.created_time).toLocaleString()}</small>
                </div>
              ))}
            </div>

            <input
              placeholder="Type your message"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              style={{ width: "70%", padding: 8 }}
            />
            <button onClick={sendWhatsAppMessage} style={{ marginLeft: 10 }}>
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
