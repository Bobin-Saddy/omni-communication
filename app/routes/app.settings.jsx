import React, { useState, useEffect } from "react";

export default function Settings({}) {
  const [fbConnected, setFbConnected] = useState(false);
  const [igConnected, setIgConnected] = useState(false);
  const [fbPages, setFbPages] = useState([]);
  const [igPages, setIgPages] = useState([]);
  const [selectedPageId, setSelectedPageId] = useState(null);
  const [selectedPlatform, setSelectedPlatform] = useState(null);

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
    if (!window.FB) return alert("FB SDK not loaded yet");

    window.FB.login(
      (res) => {
        if (res.authResponse) {
          setFbConnected(true);
          window.FB.api("/me/accounts", "GET", { access_token: res.authResponse.accessToken }, (response) => {
            if (!response || response.error) console.error(response?.error);
            else setFbPages(response.data);
          });
        }
      },
      { scope: "pages_show_list,pages_messaging,pages_read_engagement,pages_manage_posts" }
    );
  };

  const handleInstagramLogin = () => {
    if (!window.FB) return alert("FB SDK not loaded yet");

    window.FB.login(
      (res) => {
        if (res.authResponse) {
          setIgConnected(true);
          window.FB.api("/me/accounts", "GET", { access_token: res.authResponse.accessToken }, (response) => {
            if (!response || response.error) console.error(response?.error);
            else {
              const igAccounts = response.data.filter((p) => p.instagram_business_account);
              setIgPages(igAccounts);
            }
          });
        }
      },
      { scope: "pages_show_list,instagram_basic,instagram_manage_messages,pages_read_engagement,pages_manage_metadata" }
    );
  };

  const handleConnectPage = (platform, page) => {
    setSelectedPlatform(platform);
    setSelectedPageId(page.id);

    // Save connected page in localStorage or state to pass to dashboard
    localStorage.setItem("selectedPlatform", platform);
    localStorage.setItem("selectedPage", JSON.stringify(page));
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Settings</h1>

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button onClick={handleFacebookLogin} disabled={fbConnected}>Facebook Login</button>
        <button onClick={handleInstagramLogin} disabled={igConnected}>Instagram Login</button>
      </div>

      {fbPages.length > 0 && (
        <div>
          <h3>Facebook Pages</h3>
          <ul>
            {fbPages.map((page) => (
              <li key={page.id}>
                {page.name}{" "}
                <button onClick={() => handleConnectPage("facebook", page)}>
                  Connect {selectedPageId === page.id && "✅"}
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
            {igPages.map((page) => (
              <li key={page.id}>
                {page.name}{" "}
                <button onClick={() => handleConnectPage("instagram", page)}>
                  Connect {selectedPageId === page.id && "✅"}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
