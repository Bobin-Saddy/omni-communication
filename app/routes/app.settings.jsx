import React from "react";

export default function Settings({
  fbConnected,
  igConnected,
  waConnected,
  widgetConnected,
  fbPages,
  igPages,
  handleFacebookLogin,
  handleInstagramLogin,
  handleWhatsAppConnect,
  handleWidgetConnect,
  fetchConversations,
  setSelectedPage,
  selectedPage,
}) {
  return (
    <div style={{ textAlign: "center" }}>
      {/* Facebook */}
      <button
        onClick={handleFacebookLogin}
        disabled={fbConnected}
        className="btn-primary"
      >
        {fbConnected ? "✅ Facebook Connected" : "🔵 Connect Facebook"}
      </button>

      {/* Show FB Pages if connected */}
      {fbConnected && fbPages.length > 0 && (
        <div style={{ marginTop: 12 }}>
          {fbPages.map((page) => (
            <div
              key={page.id}
              onClick={() => {
                setSelectedPage({ ...page, type: "facebook" });
                fetchConversations(page);
              }}
              style={{
                padding: "10px 14px",
                margin: "6px auto",
                border: "1px solid #ddd",
                borderRadius: 10,
                maxWidth: 280,
                cursor: "pointer",
                backgroundColor:
                  selectedPage?.id === page.id ? "#dbeafe" : "white",
              }}
            >
              📘 {page.name}
            </div>
          ))}
        </div>
      )}

      {/* Instagram */}
      <button
        onClick={handleInstagramLogin}
        disabled={igConnected}
        className="btn-primary"
      >
        {igConnected ? "✅ Instagram Connected" : "📸 Connect Instagram"}
      </button>

      {igConnected && igPages.length > 0 && (
        <div style={{ marginTop: 12 }}>
          {igPages.map((page) => (
            <div
              key={page.id}
              onClick={() => {
                setSelectedPage({ ...page, type: "instagram" });
                fetchConversations(page);
              }}
              style={{
                padding: "10px 14px",
                margin: "6px auto",
                border: "1px solid #ddd",
                borderRadius: 10,
                maxWidth: 280,
                cursor: "pointer",
                backgroundColor:
                  selectedPage?.id === page.id ? "#dbeafe" : "white",
              }}
            >
              📸 {page.name}
            </div>
          ))}
        </div>
      )}

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
