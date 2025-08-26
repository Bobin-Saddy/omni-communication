import React, { useState } from "react";

export default function Settings() {
  const [fbConnected, setFbConnected] = useState(false);
  const [igConnected, setIgConnected] = useState(false);
  const [waConnected, setWaConnected] = useState(false);
  const [widgetConnected, setWidgetConnected] = useState(false);

  // Handlers
  const handleFacebookLogin = () => {
    alert("Facebook Connected!");
    setFbConnected(true);
  };

  const handleInstagramLogin = () => {
    alert("Instagram Connected!");
    setIgConnected(true);
  };

  const handleWhatsAppConnect = () => {
    alert("WhatsApp Connected!");
    setWaConnected(true);
  };

  const handleWidgetConnect = () => {
    alert("Widget Connected!");
    setWidgetConnected(true);
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <button
        onClick={handleFacebookLogin}
        disabled={fbConnected}
        className="btn-primary"
      >
        {fbConnected ? "✅ Facebook Connected" : "🔵 Connect Facebook"}
      </button>
      <br /><br />

      <button
        onClick={handleInstagramLogin}
        disabled={igConnected}
        className="btn-primary"
      >
        {igConnected ? "✅ Instagram Connected" : "📸 Connect Instagram"}
      </button>
      <br /><br />

      <button
        onClick={handleWhatsAppConnect}
        disabled={waConnected}
        className="btn-primary"
      >
        {waConnected ? "✅ WhatsApp Connected" : "💬 Connect WhatsApp"}
      </button>
      <br /><br />

      <button
        onClick={handleWidgetConnect}
        disabled={widgetConnected}
        className="btn-primary"
      >
        {widgetConnected ? "✅ Widget Connected" : "🧩 Connect Widget"}
      </button>
    </div>
  );
}
