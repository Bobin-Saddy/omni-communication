import { useState, useEffect } from "react";

export default function Settings({ selectedPage, setSelectedPage }) {
  const [fbPages, setFbPages] = useState([]);
  const [igPages, setIgPages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fbSdkLoaded, setFbSdkLoaded] = useState(false);

  const FACEBOOK_APP_ID = "544704651303656";

  // Load FB SDK
  useEffect(() => {
    if (window.FB) {
      setFbSdkLoaded(true);
      return;
    }

    window.fbAsyncInit = function () {
      window.FB.init({
        appId: FACEBOOK_APP_ID,
        cookie: true,
        xfbml: true,
        version: "v18.0",
      });

      setFbSdkLoaded(true);

      // If already logged in, fetch pages
      window.FB.getLoginStatus((res) => {
        if (res.status === "connected") {
          fetchPages(res.authResponse.accessToken);
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

  const fetchPages = async (accessToken) => {
    try {
      setLoading(true);

      const res = await fetch(
        `https://graph.facebook.com/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${accessToken}`
      );
      const data = await res.json();

      if (!data || !Array.isArray(data.data)) return;

      const fbPagesData = [];
      const igPagesData = [];

      data.data.forEach((p) => {
        fbPagesData.push({ ...p, type: "facebook" });
        if (p.instagram_business_account) {
          igPagesData.push({
            id: p.instagram_business_account.id,
            name: p.name,
            access_token: accessToken,
            type: "instagram",
            igId: p.instagram_business_account.id,
          });
        }
      });

      setFbPages(fbPagesData);
      setIgPages(igPagesData);

      // Select first page if none selected
      if (!selectedPage) {
        if (fbPagesData.length > 0) setSelectedPage(fbPagesData[0]);
        else if (igPagesData.length > 0) setSelectedPage(igPagesData[0]);
      }
    } catch (err) {
      console.error("Error fetching pages:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFBLogin = () => {
    if (!fbSdkLoaded) return alert("FB SDK not loaded yet");

    window.FB.login(
      (res) => {
        if (res.authResponse) {
          fetchPages(res.authResponse.accessToken);
        }
      },
      {
        scope:
          "pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_manage_messages",
      }
    );
  };

  const handleConnectPage = (page) => {
    // For IG, store the igId as id to match selectedPage
    if (page.type === "instagram") {
      setSelectedPage({ ...page, id: page.igId });
    } else {
      setSelectedPage(page);
    }
  };

  const isConnected = (page) =>
    selectedPage && (selectedPage.id === page.id || selectedPage.id === page.igId);

  return (
    <div style={{ padding: 20 }}>
      <h2>Settings</h2>

      <button onClick={handleFBLogin} disabled={loading}>
        {loading ? "Loading..." : "Connect Facebook / Instagram"}
      </button>

      {fbPages.length > 0 && (
        <div>
          <h3>Facebook Pages</h3>
          <ul>
            {fbPages.map((p) => (
              <li key={p.id}>
                {p.name}{" "}
                {isConnected(p) ? "✅ Connected" : (
                  <button onClick={() => handleConnectPage(p)}>Connect</button>
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
            {igPages.map((p) => (
              <li key={p.id}>
                {p.name}{" "}
                {isConnected(p) ? "✅ Connected" : (
                  <button onClick={() => handleConnectPage(p)}>Connect</button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
