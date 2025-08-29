import { useState, useEffect, useContext } from "react";
import { AppContext } from "./AppContext";
import { FaFacebook, FaInstagram, FaWhatsapp, FaComments } from "react-icons/fa";

export default function Settings() {
  const [fbPages, setFbPages] = useState([]);
  const [igPages, setIgPages] = useState([]);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [activePlatform, setActivePlatform] = useState(null);

  const FACEBOOK_APP_ID = "544704651303656";

  const { connectedPages, setConnectedPages, setSelectedPage } =
    useContext(AppContext);

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

  const handleConnectPage = (page) => {
    if (!connectedPages.some((p) => p.id === page.id)) {
      setConnectedPages([...connectedPages, page]);
    }
  };

  return (
    <div style={{ padding: 20, display: "flex", gap: "30px" }}>
      <h2>Settings</h2>

      {/* Left Sidebar Buttons (Connect + Tab) */}
      <div className="seting" style={{ display: "block", minWidth: "180px" }}>
        <button style={{ marginBottom: 20 }} onClick={handleFBLogin}>
          <FaFacebook style={{ marginRight: 8 }} /> Facebook
        </button>
        <button style={{ marginBottom: 20 }} onClick={handleIGLogin}>
          <FaInstagram style={{ marginRight: 8 }} /> Instagram
        </button>
        <button style={{ marginBottom: 20 }} onClick={handleWhatsAppConnect}>
          <FaWhatsapp style={{ marginRight: 8 }} /> WhatsApp
        </button>
        <button style={{ marginBottom: 20 }} onClick={handleChatWidgetConnect}>
          <FaComments style={{ marginRight: 8 }} /> ChatWidget
        </button>
      </div>

      {/* Right Content Area */}
      <div style={{ flex: 1 }}>
        {activePlatform === "facebook" && fbPages.length > 0 && (
          <div>
            <h3>Facebook Pages</h3>
            <ul>
              {fbPages.map((p) => (
                <li key={p.id}>
                  {p.name}{" "}
                  <button onClick={() => handleConnectPage(p)}>
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
          <div>
            <h3>Instagram Accounts</h3>
            <ul>
              {igPages.map((p) => (
                <li key={p.id}>
                  {p.name}{" "}
                  <button onClick={() => handleConnectPage(p)}>
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
          <div>
            <h3>WhatsApp</h3>
            <p>✅ Connected to WhatsApp</p>
          </div>
        )}

        {activePlatform === "chatwidget" && (
          <div>
            <h3>Chat Widget</h3>
            <p>✅ Connected to Chat Widget</p>
          </div>
        )}

        {/* Connected Pages */}
        {connectedPages.length > 0 && (
          <div style={{ marginTop: 30 }}>
            <h3>Connected Pages</h3>
            <ul>
              {connectedPages.map((p) => (
                <li key={p.id}>
                  <b>{p.name}</b> ({p.type})
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <style>{`
        .seting button {
          width: 100%;
          text-align: left;
          padding: 10px 15px;
          font-size: 16px;
          border: none;
          border-radius: 6px;
          background: #f5f5f5;
          cursor: pointer;
          display: flex;
          align-items: center;
        }
        .seting button:hover {
          background: #e9ecef;
        }
      `}</style>
    </div>
  );
}
