import { useState, useEffect } from "react";

export default function Settings({ selectedPage, setSelectedPage }) {
  const [fbPages, setFbPages] = useState([]);
  const [igPages, setIgPages] = useState([]);
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

      // Check if data.data exists and is an array
      if (!data || !Array.isArray(data.data)) {
        console.error("FB API response invalid:", data);
        return;
      }

      const pages = data.data.map((p) => ({ ...p, type: "facebook" }));
      setFbPages(pages);
      setFbConnected(true);

      if (!selectedPage && pages.length > 0) setSelectedPage(pages[0]);
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

      if (!data || !Array.isArray(data.data)) {
        console.error("IG API response invalid:", data);
        return;
      }

      const igAccounts = data.data.filter((p) => p.instagram_business_account);
      if (igAccounts.length === 0) return;

      const enriched = igAccounts.map((p) => ({
        ...p,
        type: "instagram",
        igId: p.instagram_business_account.id,
      }));

      setIgPages(enriched);
      setIgConnected(true);

      if (!selectedPage && enriched.length > 0) setSelectedPage(enriched[0]);
    } catch (err) {
      console.error("Error fetching IG pages:", err);
    }
  };

  // FB login
  const handleFBLogin = () => {
    if (!window.FB) return console.error("FB SDK not loaded yet");

    window.FB.login(
      (res) => {
        if (res.authResponse) {
          fetchFBPages(res.authResponse.accessToken);
        }
      },
      { scope: "pages_show_list,pages_read_engagement,pages_manage_posts" }
    );
  };

  // IG login
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

  const handleConnectPage = (page) => setSelectedPage(page);

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
