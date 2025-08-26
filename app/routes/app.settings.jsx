import { useState, useEffect } from "react";

export default function Settings({ onPageSelect }) {
  const [fbPages, setFbPages] = useState([]);
  const [igPages, setIgPages] = useState([]);
  const [connectedPages, setConnectedPages] = useState([]);

  const [fbConnected, setFbConnected] = useState(false);
  const [igConnected, setIgConnected] = useState(false);
  const [waConnected, setWaConnected] = useState(false);
  const [widgetConnected, setWidgetConnected] = useState(false);

  // ---------------- FACEBOOK ----------------
  const handleFacebookLogin = async () => {
    try {
      // Simulate FB Login
      const dummyPages = [
        { id: "fb_1", name: "Facebook Page 1", type: "facebook" },
        { id: "fb_2", name: "Facebook Page 2", type: "facebook" },
      ];
      setFbPages(dummyPages);
      setFbConnected(true);
      setConnectedPages((prev) => [...prev, ...dummyPages]);
    } catch (err) {
      console.error("Facebook login error:", err);
    }
  };

  // ---------------- INSTAGRAM ----------------
  const handleInstagramLogin = async () => {
    try {
      // Simulate IG Login
      const dummyPages = [
        { id: "ig_1", name: "Instagram Account 1", type: "instagram" },
        { id: "ig_2", name: "Instagram Account 2", type: "instagram" },
      ];
      setIgPages(dummyPages);
      setIgConnected(true);
      setConnectedPages((prev) => [...prev, ...dummyPages]);
    } catch (err) {
      console.error("Instagram login error:", err);
    }
  };

  // ---------------- WHATSAPP ----------------
  const handleWhatsAppConnect = () => {
    setWaConnected(true);
    const page = { id: "wa_1", name: "WhatsApp Business", type: "whatsapp" };
    setConnectedPages((prev) => [...prev, page]);
  };

  // ---------------- WIDGET ----------------
  const handleWidgetConnect = () => {
    setWidgetConnected(true);
    const page = { id: "widget_1", name: "Store Chat Widget", type: "widget" };
    setConnectedPages((prev) => [...prev, page]);
  };

  // ---------------- RENDER ----------------
  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h2 style={{ fontSize: "20px", marginBottom: "16px" }}>Settings</h2>

      {/* --- CONNECT BUTTONS --- */}
      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={handleFacebookLogin}
          disabled={fbConnected}
          className="btn"
        >
          {fbConnected ? "Facebook Connected" : "Connect Facebook"}
        </button>

        <button
          onClick={handleInstagramLogin}
          disabled={igConnected}
          className="btn"
        >
          {igConnected ? "Instagram Connected" : "Connect Instagram"}
        </button>

        <button
          onClick={handleWhatsAppConnect}
          disabled={waConnected}
          className="btn"
        >
          {waConnected ? "WhatsApp Connected" : "Connect WhatsApp"}
        </button>

        <button
          onClick={handleWidgetConnect}
          disabled={widgetConnected}
          className="btn"
        >
          {widgetConnected ? "Widget Connected" : "Connect Widget"}
        </button>
      </div>

      {/* --- CONNECTED PAGES LIST --- */}
      <h3 style={{ marginBottom: "10px" }}>Connected Pages</h3>
      {connectedPages.length === 0 ? (
        <p>No pages connected</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {connectedPages.map((page) => (
            <li key={page.id} style={{ margin: "8px 0" }}>
              <button
                onClick={() => onPageSelect(page)}
                style={{
                  padding: "8px 14px",
                  borderRadius: "8px",
                  background: "#2563eb",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {page.name} ({page.type})
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
