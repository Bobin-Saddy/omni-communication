import { useState, useEffect, useContext } from "react";
import { AppContext } from "./AppContext";

export default function Settings() {
  const [fbPages, setFbPages] = useState([]);
  const [igPages, setIgPages] = useState([]);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState("facebook"); // default tab

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

  // FB Login
  const handleFBLogin = () => {
    if (!sdkLoaded) return alert("FB SDK not loaded");
    window.FB.login(
      (res) => res.authResponse && fetchFBPages(res.authResponse.accessToken),
      { scope: "pages_show_list,pages_read_engagement,pages_manage_posts" }
    );
  };

  // IG Login
  const handleIGLogin = () => {
    if (!sdkLoaded) return alert("FB SDK not loaded");
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
    try {
      setConnectedPages((prev) => [
        ...prev.filter((p) => p.id !== "whatsapp"),
        { id: "whatsapp", name: "WhatsApp", type: "whatsapp" },
      ]);
      setSelectedPage({ id: "whatsapp", name: "WhatsApp", type: "whatsapp" });
    } catch (err) {
      console.error(err);
      alert("Failed to connect WhatsApp.");
    }
  };

  // ChatWidget Connect
  const handleChatWidgetConnect = async () => {
    try {
      setConnectedPages((prev) => [
        ...prev.filter((p) => p.id !== "chatwidget"),
        { id: "chatwidget", name: "Chat Widget", type: "chatwidget" },
      ]);
      setSelectedPage({
        id: "chatwidget",
        name: "Chat Widget",
        type: "chatwidget",
      });
    } catch (err) {
      console.error(err);
      alert("Failed to connect ChatWidget.");
    }
  };

  const handleConnectPage = (page) => {
    if (!connectedPages.some((p) => p.id === page.id)) {
      setConnectedPages([...connectedPages, page]);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Settings</h2>

      {/* Platform Tabs */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button onClick={() => setActiveTab("facebook")}>Facebook</button>
        <button onClick={() => setActiveTab("instagram")}>Instagram</button>
        <button onClick={() => setActiveTab("whatsapp")}>WhatsApp</button>
        <button onClick={() => setActiveTab("chatwidget")}>ChatWidget</button>
      </div>

      {/* Platform Connect Buttons */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        {activeTab === "facebook" && <button onClick={handleFBLogin}>Connect Facebook</button>}
        {activeTab === "instagram" && <button onClick={handleIGLogin}>Connect Instagram</button>}
        {activeTab === "whatsapp" && <button onClick={handleWhatsAppConnect}>Connect WhatsApp</button>}
        {activeTab === "chatwidget" && <button onClick={handleChatWidgetConnect}>Connect ChatWidget</button>}
      </div>

      {/* Platform Pages */}
      {activeTab === "facebook" && fbPages.length > 0 && (
        <div>
          <h3>Facebook Pages</h3>
          <ul>
            {fbPages.map((p) => (
              <li key={p.id}>
                {p.name}{" "}
                <button onClick={() => handleConnectPage(p)}>
                  {connectedPages.some((cp) => cp.id === p.id) ? "✅ Connected" : "Connect"}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {activeTab === "instagram" && igPages.length > 0 && (
        <div>
          <h3>Instagram Accounts</h3>
          <ul>
            {igPages.map((p) => (
              <li key={p.id}>
                {p.name}{" "}
                <button onClick={() => handleConnectPage(p)}>
                  {connectedPages.some((cp) => cp.id === p.id) ? "✅ Connected" : "Connect"}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {activeTab === "whatsapp" && (
        <div>
          <h3>WhatsApp</h3>
          <p>Click connect to enable WhatsApp integration</p>
        </div>
      )}

      {activeTab === "chatwidget" && (
        <div>
          <h3>Chat Widget</h3>
          <p>Click connect to enable Chat Widget integration</p>
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
  );
}
