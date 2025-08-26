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

  const FACEBOOK_APP_ID = "544704651303656";

  useEffect(() => {
    window.fbAsyncInit = function () {
      window.FB.init({
        appId: FACEBOOK_APP_ID,
        cookie: true,
        xfbml: true,
        version: "v18.0",
      });

      // Check if user is already logged in
      window.FB.getLoginStatus((res) => {
        if (res.status === "connected") {
          fetchFacebookPages(res.authResponse.accessToken);
        }
      });
    };

    if (!document.getElementById("facebook-jssdk")) {
      const js = document.createElement("script");
      js.id = "facebook-jssdk";
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      document.body.appendChild(js);
    }
  }, []);

  const fetchFacebookPages = (accessToken) => {
    if (!window.FB) return;

    window.FB.api(
      "/me/accounts",
      "GET",
      { access_token: accessToken, fields: "id,name,access_token" },
      (response) => {
        if (!response || !response.data) return;
        const tokens = {};
        const pages = response.data.map((p) => {
          tokens[p.id] = p.access_token;
          return { ...p, type: "facebook" };
        });
        setPageAccessTokens((prev) => ({ ...prev, ...tokens }));
        setFbPages(pages);
        setFbConnected(true);
      }
    );
  };

  const fetchInstagramPages = (accessToken) => {
    if (!window.FB) return;

    window.FB.api(
      "/me/accounts",
      "GET",
      { access_token: accessToken, fields: "id,name,access_token,instagram_business_account" },
      (response) => {
        if (!response || !response.data) return;
        const igAccounts = response.data.filter((p) => p.instagram_business_account);
        if (igAccounts.length === 0) return;

        const tokens = {};
        const enriched = igAccounts.map((p) => {
          tokens[p.id] = p.access_token;
          return { ...p, type: "instagram", igId: p.instagram_business_account.id };
        });
        setPageAccessTokens((prev) => ({ ...prev, ...tokens }));
        setIgPages(enriched);
        setIgConnected(true);
      }
    );
  };

  const handleFacebookLogin = () => {
    if (!window.FB) return console.error("FB SDK not loaded yet");

    window.FB.login(
      (res) => {
        if (res.authResponse) fetchFacebookPages(res.authResponse.accessToken);
      },
      { scope: "pages_show_list,pages_messaging,pages_read_engagement,pages_manage_posts" }
    );
  };

  const handleInstagramLogin = () => {
    if (!window.FB) return console.error("FB SDK not loaded yet");

    window.FB.login(
      (res) => {
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
        <button onClick={handleFacebookLogin} disabled={fbConnected}>
          Facebook Login
        </button>
        <button onClick={handleInstagramLogin} disabled={igConnected}>
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
