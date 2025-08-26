import { useState, useEffect } from "react";

export default function Settings({
  fbPages,
  igPages,
  fbConnected,
  igConnected,
  waConnected,
  widgetConnected,
  handleFacebookLogin,
  handleInstagramLogin,
  handleWhatsAppConnect,
  handleWidgetConnect,
  handlePageConnect, // new function
  connectedPages, // already connected pages
}) {
  return (
    <div style={{ textAlign: "center" }}>
      {/* Facebook Connect */}
      <button
        onClick={handleFacebookLogin}
        disabled={fbConnected}
        className="btn-primary"
      >
        {fbConnected ? "✅ Facebook Connected" : "🔵 Connect Facebook"}
      </button>

      {/* If FB connected, show FB pages */}
      {fbConnected &&
        fbPages.map((page) => (
          <div
            key={page.id}
            style={{
              marginTop: 10,
              padding: "10px",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
            }}
          >
            <span>📘 {page.name}</span>
            <button
              onClick={() => handlePageConnect(page, "facebook")}
              style={{
                marginLeft: 12,
                padding: "6px 14px",
                borderRadius: 8,
                border: "none",
                background: connectedPages.some(
                  (p) => p.id === page.id && p.type === "facebook"
                )
                  ? "#16a34a"
                  : "#2563eb",
                color: "white",
                cursor: "pointer",
              }}
            >
              {connectedPages.some(
                (p) => p.id === page.id && p.type === "facebook"
              )
                ? "✅ Connected"
                : "Connect Page"}
            </button>
          </div>
        ))}

      {/* Instagram Connect */}
      <button
        onClick={handleInstagramLogin}
        disabled={igConnected}
        className="btn-primary"
      >
        {igConnected ? "✅ Instagram Connected" : "📸 Connect Instagram"}
      </button>

      {/* If IG connected, show IG pages */}
      {igConnected &&
        igPages.map((page) => (
          <div
            key={page.id}
            style={{
              marginTop: 10,
              padding: "10px",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
            }}
          >
            <span>📸 {page.name}</span>
            <button
              onClick={() => handlePageConnect(page, "instagram")}
              style={{
                marginLeft: 12,
                padding: "6px 14px",
                borderRadius: 8,
                border: "none",
                background: connectedPages.some(
                  (p) => p.id === page.id && p.type === "instagram"
                )
                  ? "#16a34a"
                  : "#2563eb",
                color: "white",
                cursor: "pointer",
              }}
            >
              {connectedPages.some(
                (p) => p.id === page.id && p.type === "instagram"
              )
                ? "✅ Connected"
                : "Connect Page"}
            </button>
          </div>
        ))}

      {/* WhatsApp */}
      <button
        onClick={handleWhatsAppConnect}
        disabled={waConnected}
        className="btn-primary"
      >
        {waConnected ? "✅ WhatsApp Connected" : "💬 Connect WhatsApp"}
      </button>

      {/* Widget */}
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
