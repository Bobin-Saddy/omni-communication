// Settings.jsx
import React from "react";

export default function Settings({
  fbConnected,
  igConnected,
  waConnected,
  widgetConnected,
  handleFacebookLogin,
  handleInstagramLogin,
  handleWhatsAppConnect,
  handleWidgetConnect,
}) {
  const buttonStyle = (active) => ({
    padding: "10px 20px",
    margin: "10px",
    borderRadius: "8px",
    border: "none",
    cursor: active ? "not-allowed" : "pointer",
    background: active ? "#4caf50" : "#007bff",
    color: "#fff",
    fontWeight: "bold",
  });

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <button
        onClick={handleFacebookLogin}
        disabled={fbConnected}
        style={buttonStyle(fbConnected)}
      >
        {fbConnected ? "Facebook Connected" : "Connect Facebook"}
      </button>

      <button
        onClick={handleInstagramLogin}
        disabled={igConnected}
        style={buttonStyle(igConnected)}
      >
        {igConnected ? "Instagram Connected" : "Connect Instagram"}
      </button>

      <button
        onClick={handleWhatsAppConnect}
        disabled={waConnected}
        style={buttonStyle(waConnected)}
      >
        {waConnected ? "WhatsApp Connected" : "Connect WhatsApp"}
      </button>

      <button
        onClick={handleWidgetConnect}
        disabled={widgetConnected}
        style={buttonStyle(widgetConnected)}
      >
        {widgetConnected ? "Widget Connected" : "Connect Widget"}
      </button>
    </div>
  );
}
