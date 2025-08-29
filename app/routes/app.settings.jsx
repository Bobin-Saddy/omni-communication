import { useState, useEffect, useContext } from "react";
import { AppContext } from "./AppContext";
import { FaFacebook, FaInstagram, FaWhatsapp, FaComments } from "react-icons/fa";

export default function Settings() {
  const [fbPages, setFbPages] = useState([]);
  const [igPages, setIgPages] = useState([]);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [activePlatform, setActivePlatform] = useState(null);

  const FACEBOOK_APP_ID = "544704651303656";

  const {
    connectedPages,
    setConnectedPages,
    setSelectedPage,
    setConversations,
    setMessages,
  } = useContext(AppContext);

  // Load FB SDK
  useEffect(() => {
    if (document.getElementById("facebook-jssdk")) {
      setSdkLoaded(true);
      return;
    }

    window.fbAsyncInit = function () {
      window.FB.init({
        appId: FACEBOOK_APP_ID,
        cookie: true,
        xfbml: true,
        version: "v18.0",
      });
      setSdkLoaded(true);
    };

    const js = document.createElement("script");
    js.id = "facebook-jssdk";
    js.src = "https://connect.facebook.net/en_US/sdk.js";
    document.body.appendChild(js);
  }, []);

  // Fetch Facebook Pages
  const fetchFBPages = async (token) => {
    try {
      const res = await fetch(
        `https://graph.facebook.com/me/accounts?fields=id,name,access_token&access_token=${token}`
      );
      const data = await res.json();
      if (!Array.isArray(data.data)) return;
      const pages = data.data.map((p) => ({ ...p, type: "facebook" }));
      setFbPages(pages);
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch Instagram Accounts
  const fetchIGPages = async (token) => {
    try {
      const res = await fetch(
        `https://graph.facebook.com/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${token}`
      );
      const data = await res.json();
      if (!Array.isArray(data.data)) return;

      const igAccounts = data.data
        .filter((page) => page.instagram_business_account)
        .map((page) => ({
          id: `ig_${page.instagram_business_account.id}`,
          pageId: page.id,
          igId: page.instagram_business_account.id,
          name: page.name,
          type: "instagram",
          access_token: page.access_token,
        }));

      setIgPages(igAccounts);
    } catch (err) {
      console.error("Error fetching Instagram pages:", err);
    }
  };

  // FB Connect
  const handleFBLogin = () => {
    if (!sdkLoaded) return alert("FB SDK not loaded");
    setActivePlatform("facebook");
    window.FB.login(
      (res) => res.authResponse && fetchFBPages(res.authResponse.accessToken),
      { scope: "pages_show_list,pages_read_engagement,pages_manage_posts" }
    );
  };

  // IG Connect
  const handleIGLogin = () => {
    if (!sdkLoaded) return alert("FB SDK not loaded");
    setActivePlatform("instagram");
    window.FB.login(
      (res) => res.authResponse && fetchIGPages(res.authResponse.accessToken),
      {
        scope:
          "pages_show_list,instagram_basic,instagram_manage_messages,pages_read_engagement,pages_manage_metadata,pages_messaging",
      }
    );
  };

  // WhatsApp Connect
  const handleWhatsAppConnect = async () => {
    setActivePlatform("whatsapp");
    setConnectedPages((prev) => [
      ...prev.filter((p) => p.id !== "whatsapp"),
      { id: "whatsapp", name: "WhatsApp", type: "whatsapp" },
    ]);
    setSelectedPage({ id: "whatsapp", name: "WhatsApp", type: "whatsapp" });
  };

  // ChatWidget Connect
  const handleChatWidgetConnect = async () => {
    setActivePlatform("chatwidget");
    setConnectedPages((prev) => [
      ...prev.filter((p) => p.id !== "chatwidget"),
      { id: "chatwidget", name: "Chat Widget", type: "chatwidget" },
    ]);
    setSelectedPage({
      id: "chatwidget",
      name: "Chat Widget",
      type: "chatwidget",
    });
  };

  // Connect page
  const handleConnectPage = (page) => {
    if (!connectedPages.some((p) => p.id === page.id)) {
      setConnectedPages([...connectedPages, page]);
    }
  };

  // Disconnect page
  const handleDisconnectPage = (pageId) => {
    setConnectedPages((prev) => prev.filter((p) => p.id !== pageId));
    setConversations((prev) => prev.filter((c) => c.pageId !== pageId));
    setMessages((prev) => {
      const newMsgs = {};
      Object.keys(prev).forEach((key) => {
        const msgs = prev[key];
        if (Array.isArray(msgs) && msgs.length > 0) {
          const firstConv = msgs[0];
          if (firstConv.pageId !== pageId) {
            newMsgs[key] = msgs;
          }
        }
      });
      return newMsgs;
    });
  };

  return (
    <div className="settings-container">
      {/* Sidebar */}
      <div className="sidebar">
        <h2>Platforms</h2>
        <button onClick={handleFBLogin}>
          <FaFacebook className="icon fb" /> Facebook
        </button>
        <button onClick={handleIGLogin}>
          <FaInstagram className="icon ig" /> Instagram
        </button>
        <button onClick={handleWhatsAppConnect}>
          <FaWhatsapp className="icon wa" /> WhatsApp
        </button>
        <button onClick={handleChatWidgetConnect}>
          <FaComments className="icon cw" /> ChatWidget
        </button>
      </div>

      {/* Main Content */}
      <div className="content">
        {/* Available Pages */}
        {activePlatform === "facebook" && fbPages.length > 0 && (
          <div className="card">
            <h3>Facebook Pages</h3>
            <ul>
              {fbPages.map((p) => (
                <li key={p.id}>
                  {p.name}
                  <button
                    className="connect-btn"
                    onClick={() => handleConnectPage(p)}
                  >
                    {connectedPages.some((cp) => cp.id === p.id)
                      ? "✅ Connected"
                      : "Connect"}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {activePlatform === "instagram" && igPages.length > 0 && (
          <div className="card">
            <h3>Instagram Accounts</h3>
            <ul>
              {igPages.map((p) => (
                <li key={p.id}>
                  {p.name}
                  <button
                    className="connect-btn"
                    onClick={() => handleConnectPage(p)}
                  >
                    {connectedPages.some((cp) => cp.id === p.id)
                      ? "✅ Connected"
                      : "Connect"}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {activePlatform === "whatsapp" && (
          <div className="card">
            <h3>WhatsApp</h3>
            <p>✅ Connected to WhatsApp</p>
          </div>
        )}

        {activePlatform === "chatwidget" && (
          <div className="card">
            <h3>Chat Widget</h3>
            <p>✅ Connected to Chat Widget</p>
          </div>
        )}

        {/* Connected Pages */}
        {connectedPages.length > 0 && (
          <div className="card connected">
            <h3>Connected Pages</h3>
            <ul>
              {connectedPages.map((p) => (
                <li key={p.id}>
                  <span>
                    <b>{p.name}</b> <em>({p.type})</em>
                  </span>
                  <button
                    className="disconnect-btn"
                    onClick={() => handleDisconnectPage(p.id)}
                  >
                    Disconnect
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* CSS */}
      <style>{`
        .settings-container {
          display: flex;
          gap: 30px;
          padding: 20px;
          font-family: "Segoe UI", sans-serif;
          background: #f9fafb;
        }
        .sidebar {
          width: 220px;
          background: #fff;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        .sidebar h2 {
          margin-bottom: 20px;
          font-size: 18px;
          color: #333;
        }
        .sidebar button {
          display: flex;
          align-items: center;
          width: 100%;
          padding: 10px 12px;
          margin-bottom: 12px;
          border: none;
          border-radius: 8px;
          font-size: 15px;
          background: #f1f3f5;
          cursor: pointer;
          transition: background 0.2s;
        }
        .sidebar button:hover {
          background: #e9ecef;
        }
        .icon {
          margin-right: 10px;
          font-size: 18px;
        }
        .fb { color: #1877f2; }
        .ig { color: #e4405f; }
        .wa { color: #25d366; }
        .cw { color: #555; }

        .content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .card {
          background: #fff;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.06);
        }
        .card h3 {
          margin-bottom: 15px;
          font-size: 17px;
          color: #444;
        }
        .card ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .card li {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid #eee;
        }
        .card li:last-child {
          border-bottom: none;
        }
        .connect-btn {
          padding: 6px 12px;
          border: none;
          border-radius: 6px;
          background: #4cafef;
          color: #fff;
          font-size: 14px;
          cursor: pointer;
        }
        .connect-btn:hover {
          background: #379ce3;
        }
        .disconnect-btn {
          padding: 6px 12px;
          border: none;
          border-radius: 6px;
          background: #f44336;
          color: #fff;
          font-size: 14px;
          cursor: pointer;
        }
        .disconnect-btn:hover {
          background: #d32f2f;
        }
      `}</style>
    </div>
  );
}
