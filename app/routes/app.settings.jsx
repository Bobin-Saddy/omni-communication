import { useState, useEffect, useContext } from "react";
import { AppContext } from "./AppContext";

export default function Settings() {
  const [fbPages, setFbPages] = useState([]);
  const [igPages, setIgPages] = useState([]);
  const [sdkLoaded, setSdkLoaded] = useState(false);

  const FACEBOOK_APP_ID = "544704651303656";

  const { connectedPages, setConnectedPages, setSelectedPage } = useContext(AppContext);

  // ✅ Load FB SDK
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

  // ✅ Fetch FB Pages
  const fetchFBPages = async (token) => {
    try {
      const res = await fetch(
        `https://graph.facebook.com/me/accounts?fields=id,name,access_token&access_token=${token}`
      );
      const data = await res.json();
      if (!Array.isArray(data.data)) return;

      const pages = data.data.map((p) => ({ ...p, type: "facebook", access_token: p.access_token }));
      setFbPages(pages);

      // ✅ Also fetch IG business accounts linked to these pages
      const igAccounts = data.data
        .filter((p) => p.instagram_business_account)
        .map((p) => ({
          id: p.instagram_business_account.id,
          name: p.name,
          access_token: p.access_token,
          type: "instagram",
          igId: p.instagram_business_account.id,
        }));
      setIgPages(igAccounts);
    } catch (err) {
      console.error("Error fetching FB pages:", err);
    }
  };

  // ✅ FB Login
  const handleFBLogin = () => {
    if (!sdkLoaded) return alert("FB SDK not loaded yet");

    window.FB.login(
      (res) => {
        if (res.authResponse) fetchFBPages(res.authResponse.accessToken);
      },
      { scope: "pages_show_list,pages_read_engagement,pages_manage_posts" }
    );
  };

  // ✅ IG Login
  const handleIGLogin = () => {
    if (!sdkLoaded) return alert("FB SDK not loaded yet");

    window.FB.login(
      (res) => {
        if (res.authResponse) fetchFBPages(res.authResponse.accessToken);
      },
      {
        scope:
          "pages_show_list,instagram_basic,instagram_manage_messages,pages_read_engagement,pages_manage_metadata,pages_messaging",
      }
    );
  };

  // ✅ Connect page to context
  const handleConnectPage = (page) => {
    if (!connectedPages.some((p) => p.id === page.id)) {
      setConnectedPages([...connectedPages, page]);
    }
  };

  // ✅ Open chat for selected page
  const handleOpenChat = (page) => setSelectedPage(page);

  return (
    <div style={{ padding: 20 }}>
      <h2>Settings</h2>

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button onClick={handleFBLogin}>Connect Facebook</button>
        <button onClick={handleIGLogin}>Connect Instagram</button>
      </div>

      {fbPages.length > 0 && (
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

      {igPages.length > 0 && (
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

      {connectedPages.length > 0 && (
        <div style={{ marginTop: 30 }}>
          <h3>Connected Pages</h3>
          <ul>
            {connectedPages.map((p) => (
              <li key={p.id}>
                <b>{p.name}</b> ({p.type}){" "}
                <button onClick={() => handleOpenChat(p)}>💬 Open Chat</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
