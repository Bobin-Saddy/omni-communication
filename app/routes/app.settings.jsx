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
    };

    if (!document.getElementById("facebook-jssdk")) {
      const js = document.createElement("script");
      js.id = "facebook-jssdk";
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      document.body.appendChild(js);
    }
  }, []);

  const handleFacebookLogin = () => {
    window.FB.login(
      (res) => {
        if (res.authResponse) fetchFacebookPages(res.authResponse.accessToken);
      },
      {
        scope: "pages_show_list,pages_messaging,pages_read_engagement,pages_manage_posts",
      }
    );
  };

  const handleInstagramLogin = () => {
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

  const fetchFacebookPages = async (accessToken) => {
    try {
      const res = await fetch(
        `https://graph.facebook.com/me/accounts?fields=access_token,name,id&access_token=${accessToken}`
      );
      const data = await res.json();
      if (!data?.data?.length) return;

      const tokens = {};
      const pages = data.data.map((p) => {
        tokens[p.id] = p.access_token;
        return { ...p, type: "facebook" };
      });

      setPageAccessTokens((prev) => ({ ...prev, ...tokens }));
      setFbPages(pages);
      setFbConnected(true);
    } catch (err) {
      console.error("FB pages fetch failed", err);
    }
  };

  const fetchInstagramPages = async (accessToken) => {
    try {
      const res = await fetch(
        `https://graph.facebook.com/me/accounts?fields=access_token,name,id,instagram_business_account&access_token=${accessToken}`
      );
      const data = await res.json();
      if (!data?.data?.length) return;

      const igAccounts = data.data.filter((p) => p.instagram_business_account);
      const tokens = {};
      const enriched = igAccounts.map((p) => {
        tokens[p.id] = p.access_token;
        return { ...p, type: "instagram", igId: p.instagram_business_account.id };
      });

      setPageAccessTokens((prev) => ({ ...prev, ...tokens }));
      setIgPages(enriched);
      setIgConnected(true);
    } catch (err) {
      console.error("IG pages fetch failed", err);
    }
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
