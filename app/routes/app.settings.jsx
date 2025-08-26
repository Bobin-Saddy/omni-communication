import React, { useState } from "react";

export default function Settings() {
  const [fbConnected, setFbConnected] = useState(false);
  const [igConnected, setIgConnected] = useState(false);
  const [waConnected, setWaConnected] = useState(false);
  const [widgetConnected, setWidgetConnected] = useState(false);

  const buttonStyle = (active, color) => ({
    padding: "12px 22px",
    margin: "10px",
    borderRadius: "10px",
    border: "none",
    cursor: active ? "not-allowed" : "pointer",
    background: active ? "#16a34a" : color, // green if active
    color: "#fff",
    fontWeight: "600",
    fontSize: "15px",
    width: "250px",
    transition: "all 0.3s ease",
  });

  return (
    <div style={{ textAlign: "center", padding: "30px" }}>
      <h2 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "20px" }}>
        ⚙️ Connect Your Channels
      </h2>

      <button
        onClick={() => setFbConnected(true)}
        disabled={fbConnected}
        style={buttonStyle(fbConnected, "#2563eb")}
      >
        {fbConnected ? "✅ Facebook Connected" : "Connect Facebook"}
      </button>

      <button
        onClick={() => setIgConnected(true)}
        disabled={igConnected}
        style={buttonStyle(igConnected, "#db2777")}
      >
        {igConnected ? "✅ Instagram Connected" : "Connect Instagram"}
      </button>

      <button
        onClick={() => setWaConnected(true)}
        disabled={waConnected}
        style={buttonStyle(waConnected, "#22c55e")}
      >
        {waConnected ? "✅ WhatsApp Connected" : "Connect WhatsApp"}
      </button>

      <button
        onClick={() => setWidgetConnected(true)}
        disabled={widgetConnected}
        style={buttonStyle(widgetConnected, "#6b7280")}
      >
        {widgetConnected ? "✅ Widget Connected" : "Connect Widget"}
      </button>
    </div>
  );
}
