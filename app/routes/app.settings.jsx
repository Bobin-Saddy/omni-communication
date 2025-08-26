import React, { useState } from "react";

export default function Dashboard() {
  const [fbConnected, setFbConnected] = useState(false);
  const [igConnected, setIgConnected] = useState(false);
  const [waConnected, setWaConnected] = useState(false);
  const [widgetConnected, setWidgetConnected] = useState(false);

  // Handlers
  const handleFacebookLogin = () => {
    console.log("Facebook login clicked");
    setFbConnected(true);
  };

  const handleInstagramLogin = () => {
    console.log("Instagram login clicked");
    setIgConnected(true);
  };

  const handleWhatsAppConnect = () => {
    console.log("WhatsApp connect clicked");
    setWaConnected(true);
  };

  const handleWidgetConnect = () => {
    console.log("Widget connect clicked");
    setWidgetConnected(true);
  };

  return (
    <div>
      <h1>My Dashboard</h1>

      {/* Call Settings Component */}
      <Settings
        fbConnected={fbConnected}
        igConnected={igConnected}
        waConnected={waConnected}
        widgetConnected={widgetConnected}
        handleFacebookLogin={handleFacebookLogin}
        handleInstagramLogin={handleInstagramLogin}
        handleWhatsAppConnect={handleWhatsAppConnect}
        handleWidgetConnect={handleWidgetConnect}
      />
    </div>
  );
}
