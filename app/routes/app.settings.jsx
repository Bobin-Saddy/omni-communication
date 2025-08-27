import { useState, useEffect, useContext } from "react";
import { AppContext } from "./AppContext";

export default function Settings() {
  const [fbPages, setFbPages] = useState([]);
  const [igPages, setIgPages] = useState([]);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [waConnected, setWaConnected] = useState(false);

  const FACEBOOK_APP_ID = "544704651303656";
  const WHATSAPP_TOKEN =
    "EAAHvZAZB8ZCmugBPTKCOgb1CojZAJ28WWZAgmM9SiqSYFHgCZBfgvVcd9KF2I61b2wj4wfvX7PHUnnHoRsLOe7FuiY1qg5zrZCxMg6brDnSfeQKtkcAdB8fzIE9RoCDYtHGXhhoQOkF5JZBLk8RrsBY3eh4MLXxZBXR0pZBUQwH3ixqFHONx68DhvB9BsdnNAJXyMraXkxUqIO2mPyC3bf5S2eeSg1tbJhGBB2uYSO02cbJwZDZD";
  const WHATSAPP_PHONE_NUMBER_ID = "106660072463312";

  const { connectedPages, setConnectedPages, setSelectedPage } = useContext(AppContext);

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

  // Fetch FB Pages
  const fetchFBPages = async (token) => {
    try {
      const res = await fetch(
        `https://graph.facebook.com/me/accounts?fields=id,name,access_token&access_token=${token}`
      );
      const data = await res.json();
      if (!Array.isArray(data.data)) return;

      const pages = data.data.map((p) => ({
        ...p,
        type: "facebook",
        access_token: p.access_token,
      }));
      setFbPages(pages);
    } catch (err) {
      console.error("Error fetching FB pages:", err);
    }
  };

  // Fetch IG Accounts
  const fetchIGPages = async (token) => {
    try {
      const res = await fetch(
        `https://graph.facebook.com/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${token}`
      );
      const data = await res.json();
      if (!Array.isArray(data.data)) return;

      const igAccounts = data.data
        .filter((p) => p.instagram_business_account)
        .map((p) => ({
          id: p.instagram_business_account.id,
          name: p.name,
          access_token: token,
          type: "instagram",
          igId: p.instagram_business_account.id,
        }));
      setIgPages(igAccounts);
    } catch (err) {
      console.error("Error fetching IG pages:", err);
    }
  };

  const handleFBLogin = () => {
    if (!sdkLoaded) return alert("FB SDK not loaded yet");
    window.FB.login(
      (res) => {
        if (res.authResponse) fetchFBPages(res.authResponse.accessToken);
      },
      { scope: "pages_show_list,pages_read_engagement,pages_manage_posts" }
    );
  };

  const handleIGLogin = () => {
    if (!sdkLoaded) return alert("FB SDK not loaded yet");
    window.FB.login(
      (res) => {
        if (res.authResponse) fetchIGPages(res.authResponse.accessToken);
      },
      {
        scope:
          "pages_show_list,instagram_basic,instagram_manage_messages,pages_read_engagement,pages_manage_metadata",
      }
    );
  };

  // Connect WhatsApp
  const handleWhatsAppConnect = async () => {
    try {
      const res = await fetch(
        `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/contacts?access_token=${WHATSAPP_TOKEN}`
      );
      const users = await res.json(); // [{ input: number }]
      const waPage = { id: "whatsapp", name: "WhatsApp", type: "whatsapp", users: users.data || [] };

      if (!connectedPages.some((p) => p.id === waPage.id)) {
        setConnectedPages([...connectedPages, waPage]);
      }

      setSelectedPage(waPage);
      setWaConnected(true);
    } catch (error) {
      alert("Failed to connect WhatsApp.");
      console.error(error);
    }
  };

  const handleConnectPage = (page) => {
    if (!connectedPages.some((p) => p.id === page.id)) {
      setConnectedPages([...connectedPages, page]);
    }
  };

  const handleOpenChat = (page) => {
    setSelectedPage(page);
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Settings</h2>

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button onClick={handleFBLogin}>Connect Facebook</button>
        <button onClick={handleIGLogin}>Connect Instagram</button>
        <button onClick={handleWhatsAppConnect}>
          {waConnected ? "✅ WhatsApp Connected" : "Connect WhatsApp"}
        </button>
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
