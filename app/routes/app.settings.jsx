import React, { useState, useEffect } from "react";

export default function Settings({
  selectedPage,
  setSelectedPage,
  pageAccessTokens,
  setPageAccessTokens,
}) {
  const [fbPages, setFbPages] = useState([]);
  const [igPages, setIgPages] = useState([]);
  const [fbConnected, setFbConnected] = useState(false);
  const [igConnected, setIgConnected] = useState(false);
  const [sdkLoaded, setSdkLoaded] = useState(false);

  const FACEBOOK_APP_ID = "544704651303656";

  // Load Facebook SDK
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
    js.async = true;
    document.body.appendChild(js);
  }, []);

  const fetchFacebookPages = async (accessToken) => {
    try {
      const res = await fetch(
        `https://graph.facebook.com/me/accounts?fields=access_token,name,id&access_token=${accessToken}`
      );
      const data = await res.json();
      console.log("FB Pages:", data);

      if (!Array.isArray(data?.data) || data.data.length === 0) return;

      const tokens = {};
      const pages = data.data.map((p) => {
        tokens[p.id] = p.access_token;
        return { ...p, type: "facebook" };
      });

      setPageAccessTokens((prev) => ({ ...prev, ...tokens }));
      setFbPages(pages);
      setFbConnected(true);
    } catch (err) {
      console.error("FB pages fetch failed:", err);
    }
  };

  const fetchInstagramPages = async (accessToken) => {
    try {
      const res = await fetch(
        `https://graph.facebook.com/me/accounts?fields=access_token,name,id,instagram_business_account&access_token=${accessToken}`
      );
      const data = await res.json();
      console.log("IG Pages:", data);

      if (!Array.isArray(data?.data) || data.data.length === 0) return;

      const igAccounts = data.data.filter((p) => p.instagram_business_account);
      if (igAccounts.length === 0) return;

      const tokens = {};
      const enriched = igAccounts.map((p) => {
        tokens[p.id] = p.access_token;
        return { ...p, type: "instagram", igId: p.instagram_business_account.id };
      });

      setPageAccessTokens((prev) => ({ ...prev, ...tokens }));
      setIgPages(enriched);
      setIgConnected(true);
    } catch (err) {
      console.error("IG pages fetch failed:", err);
    }
  };

  const handleFacebookLogin = () => {
    if (!sdkLoaded) return console.error("FB SDK not loaded yet");

    window.FB.login(
      (res) => {
        console.log("FB login result:", res);
        if (res.authResponse) fetchFacebookPages(res.authResponse.accessToken);
      },
      { scope: "pages_show_list,pages_messaging,pages_read_engagement,pages_manage_posts" }
    );
  };

  const handleInstagramLogin = () => {
    if (!sdkLoaded) return console.error("FB SDK not loaded yet");

    window.FB.login(
      (res) => {
        console.log("IG login result:", res);
        if (res.authResponse) fetchInstagramPages(res.authResponse.accessToken);
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
      <h1>Settings</h1>

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button onClick={handleFacebookLogin} disabled={fbConnected || !sdkLoaded}>
          Facebook Login
        </button>
        <button onClick={handleInstagramLogin} disabled={igConnected || !sdkLoaded}>
          Instagram Login
        </button>
      </div>

      {fbPages.length > 0 && (
        <div>
          <h3>Facebook Pages</h3>
          <ul>
            {fbPages.map((page) => (
              <li key={page.id}>
                {page.name}{" "}
                {selectedPage?.id === page.id ? (
                  "✅ Connected"
                ) : (
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
                {selectedPage?.id === page.id ? (
                  "✅ Connected"
                ) : (
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
