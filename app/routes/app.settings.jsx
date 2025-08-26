import { useState, useEffect } from "react";

export default function Settings({ onPageSelect }) {
  const [fbPages, setFbPages] = useState([]);
  const [igPages, setIgPages] = useState([]);
  const [fbConnected, setFbConnected] = useState(false);
  const [igConnected, setIgConnected] = useState(false);
  const [waConnected, setWaConnected] = useState(false);
  const [widgetConnected, setWidgetConnected] = useState(false);

  // ---- HANDLE CONNECTIONS ----
  const connectFacebook = () => {
    setFbConnected(true);
    setFbPages([
      { id: "fb1", name: "FB Page 1", type: "facebook" },
      { id: "fb2", name: "FB Page 2", type: "facebook" },
    ]);
  };

  const connectInstagram = () => {
    setIgConnected(true);
    setIgPages([
      { id: "ig1", name: "IG Page 1", type: "instagram" },
      { id: "ig2", name: "IG Page 2", type: "instagram" },
    ]);
  };

  const connectWhatsApp = () => {
    setWaConnected(true);
  };

  const connectWidget = () => {
    setWidgetConnected(true);
  };

  // ---- RENDER ----
  return (
    <div
      style={{
        padding: 20,
        fontFamily: "Inter, Arial, sans-serif",
        maxWidth: 800,
        margin: "0 auto",
      }}
    >
      <h2 style={{ fontSize: 24, marginBottom: 20 }}>Settings</h2>

      {/* FACEBOOK */}
      <div style={sectionStyle}>
        <h3 style={titleStyle}>Facebook</h3>
        {fbConnected ? (
          <div>
            <p style={{ color: "green" }}>Connected ✅</p>
            {fbPages.map((page) => (
              <button
                key={page.id}
                style={pageButtonStyle}
                onClick={() => onPageSelect(page)}
              >
                {page.name}
              </button>
            ))}
          </div>
        ) : (
          <button style={connectButtonStyle} onClick={connectFacebook}>
            Connect Facebook
          </button>
        )}
      </div>

      {/* INSTAGRAM */}
      <div style={sectionStyle}>
        <h3 style={titleStyle}>Instagram</h3>
        {igConnected ? (
          <div>
            <p style={{ color: "green" }}>Connected ✅</p>
            {igPages.map((page) => (
              <button
                key={page.id}
                style={pageButtonStyle}
                onClick={() => onPageSelect(page)}
              >
                {page.name}
              </button>
            ))}
          </div>
        ) : (
          <button style={connectButtonStyle} onClick={connectInstagram}>
            Connect Instagram
          </button>
        )}
      </div>

      {/* WHATSAPP */}
      <div style={sectionStyle}>
        <h3 style={titleStyle}>WhatsApp</h3>
        {waConnected ? (
          <p style={{ color: "green" }}>Connected ✅</p>
        ) : (
          <button style={connectButtonStyle} onClick={connectWhatsApp}>
            Connect WhatsApp
          </button>
        )}
      </div>

      {/* WIDGET */}
      <div style={sectionStyle}>
        <h3 style={titleStyle}>Widget</h3>
        {widgetConnected ? (
          <p style={{ color: "green" }}>Connected ✅</p>
        ) : (
          <button style={connectButtonStyle} onClick={connectWidget}>
            Connect Widget
          </button>
        )}
      </div>
    </div>
  );
}

/* ---- STYLES ---- */
const sectionStyle = {
  background: "#f9fafb",
  padding: 16,
  borderRadius: 12,
  marginBottom: 20,
  boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
};

const titleStyle = {
  fontSize: 18,
  marginBottom: 10,
};

const connectButtonStyle = {
  background: "#2563eb",
  color: "white",
  padding: "10px 16px",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: 14,
};

const pageButtonStyle = {
  background: "#f3f4f6",
  padding: "8px 14px",
  border: "1px solid #ddd",
  borderRadius: 6,
  cursor: "pointer",
  marginRight: 8,
  marginBottom: 8,
};
