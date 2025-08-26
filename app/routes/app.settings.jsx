import { useState, useEffect } from "react";

export default function Settings({ onPageSelect }) {
  const [connections, setConnections] = useState({
    facebook: false,
    instagram: false,
    whatsapp: false,
    widget: false,
  });

  // Example: load saved state (you can replace with API call)
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("connections")) || {};
    setConnections((prev) => ({ ...prev, ...saved }));
  }, []);

  // Save whenever state changes
  useEffect(() => {
    localStorage.setItem("connections", JSON.stringify(connections));
  }, [connections]);

  // Toggle connect/disconnect
  const toggleConnection = (platform) => {
    setConnections((prev) => ({
      ...prev,
      [platform]: !prev[platform],
    }));

    if (!connections[platform]) {
      onPageSelect?.({ type: platform, id: `${platform}-page-id` });
    }
  };

  const platforms = [
    { key: "facebook", label: "Facebook" },
    { key: "instagram", label: "Instagram" },
    { key: "whatsapp", label: "WhatsApp" },
    { key: "widget", label: "Widget" },
  ];

  return (
    <div
      style={{
        padding: "20px",
        fontFamily: "Inter, Arial, sans-serif",
        maxWidth: 600,
        margin: "auto",
        background: "#f9fafb",
        borderRadius: "12px",
        boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
      }}
    >
      <h2 style={{ marginBottom: "20px", color: "#111827" }}>
        Platform Connections
      </h2>

      {platforms.map((p) => (
        <div
          key={p.key}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 16px",
            marginBottom: "10px",
            background: "#fff",
            borderRadius: "8px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <span style={{ fontSize: "16px", fontWeight: 500 }}>{p.label}</span>
          <button
            onClick={() => toggleConnection(p.key)}
            style={{
              padding: "8px 14px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 500,
              color: "#fff",
              background: connections[p.key] ? "#ef4444" : "#3b82f6",
              transition: "background 0.3s",
            }}
          >
            {connections[p.key] ? "Disconnect" : "Connect"}
          </button>
        </div>
      ))}
    </div>
  );
}
