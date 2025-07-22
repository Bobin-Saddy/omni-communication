import { useState } from "react";
import { Page, Card, Button, Text } from "@shopify/polaris";

export default function WhatsAppChat() {
  const [waConnected, setWaConnected] = useState(false);
  const [waMessages, setWaMessages] = useState([]);
  const [waNewMessage, setWaNewMessage] = useState("");

  // Replace these with your real Meta WhatsApp Cloud API details
  const WHATSAPP_TOKEN = "YOUR_WHATSAPP_CLOUD_API_TOKEN";
  const WHATSAPP_PHONE_ID = "YOUR_WHATSAPP_PHONE_NUMBER_ID";
  const WA_RECIPIENT_NUMBER = "RECIPIENT_PHONE_NUMBER_WITH_COUNTRY_CODE"; // e.g., "918123456789"

  const handleWhatsAppConnect = () => {
    // WhatsApp Cloud API uses static tokens, so simulate connect for UI
    setWaConnected(true);
  };

  const sendWhatsAppMessage = () => {
    if (!waNewMessage.trim()) return;

    fetch(
      `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_ID}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: WA_RECIPIENT_NUMBER,
          type: "text",
          text: { body: waNewMessage },
        }),
      }
    )
      .then((res) => res.json())
      .then((data) => {
        console.log("WhatsApp message sent:", data);
        setWaMessages((prev) => [
          ...prev,
          { from: "You", text: waNewMessage, time: new Date().toLocaleString() },
        ]);
        setWaNewMessage("");
      })
      .catch((err) => console.error("Error sending WhatsApp message:", err));
  };

  const styles = {
    card: {
      borderRadius: "14px",
      boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
      padding: "25px",
      maxWidth: "600px",
      margin: "0 auto",
    },
    input: {
      width: "100%",
      padding: "10px 14px",
      border: "1px solid #dfe3e8",
      borderRadius: "6px",
    },
    messageBox: {
      background: "#f4f6f8",
      padding: "15px",
      borderRadius: "10px",
      marginBottom: "20px",
      maxHeight: "400px",
      overflowY: "auto",
    },
    message: {
      background: "#fff",
      padding: "10px",
      borderRadius: "6px",
      marginBottom: "10px",
    },
  };

  return (
    <Page title="💬 WhatsApp Chat">
      <Card sectioned style={styles.card}>
        {!waConnected ? (
          <Button onClick={handleWhatsAppConnect} primary>
            Connect with WhatsApp
          </Button>
        ) : (
          <>
            <Text variant="headingMd" as="h2" style={{ marginBottom: "20px" }}>
              WhatsApp Chat Connected ✅
            </Text>

            <div style={styles.messageBox}>
              {waMessages.map((msg, idx) => (
                <div key={idx} style={styles.message}>
                  <strong>{msg.from}</strong>: {msg.text}
                  <div style={{ fontSize: "12px", color: "#666" }}>{msg.time}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <input
                type="text"
                value={waNewMessage}
                onChange={(e) => setWaNewMessage(e.target.value)}
                placeholder="Type WhatsApp message..."
                style={styles.input}
              />
              <Button onClick={sendWhatsAppMessage} primary>
                Send
              </Button>
            </div>
          </>
        )}
      </Card>
    </Page>
  );
}
