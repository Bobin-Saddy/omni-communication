import React from "react";

export default function ConnectPage({
  fbConnected,
  igConnected,
  waConnected,
  widgetConnected,
  handleFacebookLogin,
  handleInstagramLogin,
  handleWhatsAppConnect,
  handleWidgetConnect,
}) {
  const services = [
    {
      name: "Facebook",
      connected: fbConnected,
      handler: handleFacebookLogin,
      color: "#1877f2",
    },
    {
      name: "Instagram",
      connected: igConnected,
      handler: handleInstagramLogin,
      color: "#e4405f",
    },
    {
      name: "WhatsApp",
      connected: waConnected,
      handler: handleWhatsAppConnect,
      color: "#25d366",
    },
    {
      name: "Widget",
      connected: widgetConnected,
      handler: handleWidgetConnect,
      color: "#6b7280",
    },
  ];

  return (
    <div className="connect-page" style={{ textAlign: "center", padding: "20px" }}>
      <h2 style={{ marginBottom: "20px", fontSize: "22px" }}>Connect Your Channels</h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "20px",
          maxWidth: "800px",
          margin: "0 auto",
        }}
      >
        {services.map((service) => (
          <div
            key={service.name}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              padding: "20px",
              background: "#fff",
              boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
            }}
          >
            <h3 style={{ fontSize: "18px", marginBottom: "10px" }}>{service.name}</h3>
            <button
              onClick={service.handler}
              disabled={service.connected}
              style={{
                width: "100%",
                padding: "10px 15px",
                backgroundColor: service.connected ? "#9ca3af" : service.color,
                color: "#fff",
                fontWeight: "600",
                border: "none",
                borderRadius: "8px",
                cursor: service.connected ? "not-allowed" : "pointer",
                transition: "all 0.3s ease",
              }}
            >
              {service.connected ? "Connected" : `Connect ${service.name}`}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
