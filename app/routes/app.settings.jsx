import { useState, useEffect } from "react";

export default function Settings({ connectedPages, setConnectedPages }) {
  const [fbPages, setFbPages] = useState([]);
  const [igPages, setIgPages] = useState([]);
  const [loadingFB, setLoadingFB] = useState(false);
  const [loadingIG, setLoadingIG] = useState(false);

  const FACEBOOK_APP_ID = "544704651303656";

  // Load Facebook SDK
  useEffect(() => {
    if (document.getElementById("facebook-jssdk")) return;

    window.fbAsyncInit = function () {
      window.FB.init({
        appId: FACEBOOK_APP_ID,
        cookie: true,
        xfbml: true,
        version: "v18.0",
      });

      window.FB.getLoginStatus((res) => {
        if (res.status === "connected") {
          fetchFBPages(res.authResponse.accessToken);
          fetchIGPages(res.authResponse.accessToken);
        }
      });
    };

    const js = document.createElement("script");
    js.id = "facebook-jssdk";
    js.src = "https://connect.facebook.net/en_US/sdk.js";
    document.body.appendChild(js);
  }, []);

  // Fetch FB Pages
  const fetchFBPages = async (accessToken) => {
    try {
      const res = await fetch(
        `https://graph.facebook.com/me/accounts?fields=id,name,access_token&access_token=${accessToken}`
      );
      const data = await res.json();

      if (!Array.isArray(data.data)) return;

      const pages = data.data.map((p) => ({ ...p, type: "facebook", access_token: accessToken }));
      setFbPages(pages);
    } catch (err) {
      console.error("Error fetching FB pages:", err);
    }
  };

  // Fetch IG Pages
  const fetchIGPages = async (accessToken) => {
    try {
      const res = await fetch(
        `https://graph.facebook.com/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${accessToken}`
      );
      const data = await res.json();

      if (!Array.isArray(data.data)) return;

      const igAccounts = data.data
        .filter((p) => p.instagram_business_account)
        .map((p) => ({
          id: p.instagram_business_account.id,
          name: p.name,
          access_token: accessToken,
          type: "instagram",
          igId: p.instagram_business_account.id,
        }));

      setIgPages(igAccounts);
    } catch (err) {
      console.error("Error fetching IG pages:", err);
    }
  };

  // FB login
  const handleFBLogin = () => {
    if (!window.FB) return alert("FB SDK not loaded yet");
    setLoadingFB(true);

    window.FB.login(
      async (res) => {
        if (res.authResponse) {
          await fetchFBPages(res.authResponse.accessToken);
        }
        setLoadingFB(false);
      },
      { scope: "pages_show_list,pages_read_engagement,pages_manage_posts" }
    );
  };

  // IG login
  const handleIGLogin = () => {
    if (!window.FB) return alert("FB SDK not loaded yet");
    setLoadingIG(true);

    window.FB.login(
      async (res) => {
        if (res.authResponse) {
          await fetchIGPages(res.authResponse.accessToken);
        }
        setLoadingIG(false);
      },
      {
        scope:
          "pages_show_list,instagram_basic,instagram_manage_messages,pages_read_engagement,pages_manage_metadata",
      }
    );
  };

  const handleConnectPage = (page) => {
    if (!connectedPages.some((p) => p.id === page.id)) {
      setConnectedPages([...connectedPages, page]);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Settings</h2>

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button onClick={handleFBLogin} disabled={loadingFB}>
          {loadingFB ? "Loading FB..." : "Connect Facebook"}
        </button>
        <button onClick={handleIGLogin} disabled={loadingIG}>
          {loadingIG ? "Loading IG..." : "Connect Instagram"}
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
    </div>
  );
}
