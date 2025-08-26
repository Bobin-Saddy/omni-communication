import { useState, useEffect } from "react";

export default function Settings({
  selectedPage,
  setSelectedPage,
  fbPages,
  setFbPages,
  igPages,
  setIgPages,
}) {
  const [fbConnected, setFbConnected] = useState(false);
  const [igConnected, setIgConnected] = useState(false);

  const FACEBOOK_APP_ID = "544704651303656";

  // Load FB SDK
  useEffect(() => {
    if (document.getElementById("facebook-jssdk")) return;

    window.fbAsyncInit = function () {
      window.FB.init({
        appId: FACEBOOK_APP_ID,
        cookie: true,
        xfbml: true,
        version: "v18.0",
      });

      // Auto-fetch pages if already logged in
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

  // Fetch Facebook Pages
  const fetchFBPages = async (accessToken) => {
    try {
      const res = await fetch(
        `https://graph.facebook.com/me/accounts?fields=id,name,access_token&access_token=${accessToken}`
      );
      const data = await res.json();
      if (!data?.data?.length) return;

      const enriched = data.data.map((p) => ({ ...p, type: "facebook" }));
      setFbPages(enriched);
      setFbConnected(true);
      setSelectedPage(enriched[0]);
    } catch (err) {
      console.error("Error fetching FB pages:", err);
    }
  };

  // Fetch Instagram Pages
  const fetchIGPages = async (accessToken) => {
    try {
      const res = await fetch(
        `https://graph.facebook.com/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${accessToken}`
      );
      const data = await res.json();
      if (!data?.data?.length) return;

      const igAccounts = data.data.filter((p) => p.instagram_business_account);
      if (!igAccounts.length) return;

      const enriched = igAccounts.map((p) => ({
        ...p,
        type: "instagram",
        igId: p.instagram_business_account.id,
      }));
      setIgPages(enriched);
      setIgConnected(true);
      setSelectedPage(enriched[0]);
    } catch (err) {
      console.error("Error fetching IG pages:", err);
    }
  };

  // FB Login
  const handleFBLogin = () => {
    if (!window.FB) return console.error("FB SDK not loaded yet");

    window.FB.login(
      (res) => {
        if (res.authResponse) fetchFBPages(res.authResponse.accessToken);
      },
      { scope: "pages_show_list,pages_messaging,pages_read_engagement,pages_manage_posts" }
    );
  };

  // IG Login
  const handleIGLogin = () => {
    if (!window.FB) return console.error("FB SDK not loaded yet");

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

  const handleConnectPage = (page) => {
    setSelectedPage(page);
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Settings</h2>

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button onClick={handleFBLogin} disabled={fbConnected}>
          Login Facebook
        </button>
        <button onClick={handleIGLogin} disabled={igConnected}>
          Login Instagram
        </button>
      </div>

      {fbPages.length > 0 && (
        <div>
          <h3>Facebook Pages</h3>
          <ul>
            {fbPages.map((page) => (
              <li key={page.id}>
                {page.name}{" "}
                {selectedPage?.id === page.id ? "✅ Connected" : (
                  <button onClick={() => handleConnectPage(page)}>Connect</button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {igPages.length > 0 && (
        <div>
          <h3>Instagram Accounts</h3>
          <ul>
            {igPages.map((page) => (
              <li key={page.id}>
                {page.name}{" "}
                {selectedPage?.id === page.id ? "✅ Connected" : (
                  <button onClick={() => handleConnectPage(page)}>Connect</button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
