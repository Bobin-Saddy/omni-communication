import React, { useState } from "react";

export default function AppSettings({
  fbConnected,
  igConnected,
  waConnected,
  widgetConnected,
  handleFacebookLogin,
  handleInstagramLogin,
  handleWhatsAppConnect,
  handleWidgetConnect,
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: 50,
        minHeight: "70vh",
        background: "linear-gradient(135deg, #e0e7ff, #fef2f2)",
        borderRadius: 18,
      }}
    >
      <h2
        style={{
          fontSize: 28,
          fontWeight: 800,
          marginBottom: 24,
          color: "#1e293b",
        }}
      >
        ⚙️ Connect Your Channels
      </h2>

      <button
        onClick={handleFacebookLogin}
        disabled={fbConnected}
        className="btn-primary"
      >
        {fbConnected ? "✅ Facebook Connected" : "🔵 Connect Facebook"}
      </button>
      <button
        onClick={handleInstagramLogin}
        disabled={igConnected}
        className="btn-primary"
      >
        {igConnected ? "✅ Instagram Connected" : "📸 Connect Instagram"}
      </button>
      <button
        onClick={handleWhatsAppConnect}
        disabled={waConnected}
        className="btn-primary"
      >
        {waConnected ? "✅ WhatsApp Connected" : "💬 Connect WhatsApp"}
      </button>
      <button
        onClick={handleWidgetConnect}
        disabled={widgetConnected}
        className="btn-primary"
      >
        {widgetConnected ? "✅ Widget Connected" : "🧩 Connect Widget"}
      </button>

      <style>{`
        .btn-primary {
          background: linear-gradient(135deg,#111827,#1f2937);
          color: white;
          padding: 14px 26px;
          border: none;
          border-radius: 14px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          width: 260px;
          margin: 10px 0;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(0,0,0,0.12);
        }
        .btn-primary:disabled {
          background: #9ca3af;
          cursor: not-allowed;
          box-shadow: none;
        }
        .btn-primary:not(:disabled):hover {
          background: linear-gradient(135deg,#1e293b,#111827);
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
}
