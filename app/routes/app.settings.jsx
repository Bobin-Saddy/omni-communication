import { useState } from "react";

export default function AppSettings() {
  const [fbConnected, setFbConnected] = useState(false);
  const [igConnected, setIgConnected] = useState(false);
  const [waConnected, setWaConnected] = useState(false);
  const [widgetConnected, setWidgetConnected] = useState(false);

  const handleFacebookLogin = () => setFbConnected(true);
  const handleInstagramLogin = () => setIgConnected(true);
  const handleWhatsAppConnect = () => setWaConnected(true);
  const handleWidgetConnect = () => setWidgetConnected(true);

  return (
    <div
      style={{
        maxWidth: 600,
        margin: "40px auto",
        textAlign: "center",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 20 }}>
        ⚙️ App Settings
      </h2>

      <button
        onClick={handleFacebookLogin}
        disabled={fbConnected}
        className="btn-primary"
      >
        {fbConnected ? "✅ Facebook Connected" : "🔵 Connect Facebook"}
      </button>
      <br />
      <button
        onClick={handleInstagramLogin}
        disabled={igConnected}
        className="btn-primary"
      >
        {igConnected ? "✅ Instagram Connected" : "📸 Connect Instagram"}
      </button>
      <br />
      <button
        onClick={handleWhatsAppConnect}
        disabled={waConnected}
        className="btn-primary"
      >
        {waConnected ? "✅ WhatsApp Connected" : "💬 Connect WhatsApp"}
      </button>
      <br />
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
