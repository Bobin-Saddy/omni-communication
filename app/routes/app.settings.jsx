import React, { useState, useEffect } from "react";

export default function Settings({ setSelectedPlatform, setSelectedPage }) {
  const [fbConnected, setFbConnected] = useState(false);
  const [igConnected, setIgConnected] = useState(false);
  const [fbPages, setFbPages] = useState([]);
  const [igPages, setIgPages] = useState([]);

  const FACEBOOK_APP_ID = "544704651303656";

  // Initialize FB SDK
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
      async (res) => {
        if (res.authResponse) {
          setFbConnected(true);
          const token = res.authResponse.accessToken;
          fetchFacebookPages(token);
        }
      },
      { scope: "pages_show_list,pages_messaging,pages_read_engagement,pages_manage_posts" }
    );
  };

  const handleInstagramLogin = () => {
    window.FB.login(
      async (res) => {
        if (res.authResponse) {
          setIgConnected(true);
          const token = res.authResponse.accessToken;
          fetchInstagramPages(token);
        }
      },
      {
        scope:
          "pages_show_list,instagram_basic,instagram_manage_messages,pages_read_engagement,pages_manage_metadata",
      }
    );
  };

  const fetchFacebookPages = (token) => {
    window.FB.api(
      "/me/accounts",
      "GET",
      { access_token: token },
      function (response) {
        if (!response || response.error) {
          console.error("Error fetching FB Pages", response?.error);
        } else {
          setFbPages(response.data);
        }
      }
    );
  };

  const fetchInstagramPages = (token) => {
    window.FB.api(
      "/me/accounts",
      "GET",
      { access_token: token },
      function (response) {
        if (!response || response.error) {
          console.error("Error fetching IG Accounts", response?.error);
        } else {
          // Filter accounts with Instagram business
          const igAccounts = response.data.filter((p) => p.instagram_business_account);
          setIgPages(igAccounts);
        }
      }
    );
  };

  const handleConnectPage = (platform, page) => {
    setSelectedPlatform(platform);
    setSelectedPage(page); // app._index.jsx will detect this and load conversations
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
                <button onClick={() => handleConnectPage("facebook", page)}>Connect</button>
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
                <button onClick={() => handleConnectPage("instagram", page)}>Connect</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
