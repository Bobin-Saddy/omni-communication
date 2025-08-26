import React, { useState, useEffect } from "react";

export default function Settings({ setSelectedPlatform, setSelectedUser }) {
  const [fbConnected, setFbConnected] = useState(false);
  const [igConnected, setIgConnected] = useState(false);
  const [waConnected, setWaConnected] = useState(false);
  const [widgetConnected, setWidgetConnected] = useState(false);

  // Simulate login/connect functionality
  const handleFacebookClick = () => {
    setSelectedPlatform("facebook");
    setFbConnected(true);
  };

  const handleInstagramClick = () => {
    setSelectedPlatform("instagram");
    setIgConnected(true);
  };

  const handleWhatsAppClick = () => setWaConnected(true);
  const handleWidgetClick = () => setWidgetConnected(true);

  return (
    <div style={{ padding: 20, textAlign: "center" }}>
      <h1>Settings</h1>
      <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
        <button onClick={handleFacebookClick} disabled={fbConnected}>
          Facebook
        </button>
        <button onClick={handleInstagramClick} disabled={igConnected}>
          Instagram
        </button>
        <button onClick={handleWhatsAppClick} disabled={waConnected}>
          WhatsApp
        </button>
        <button onClick={handleWidgetClick} disabled={widgetConnected}>
          Chat Widget
        </button>
      </div>
    </div>
  );
}
