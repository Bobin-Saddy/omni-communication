import { useState, useEffect } from "react";

export default function Settings({ selectedPage, setSelectedPage }) {
  const [fbPages, setFbPages] = useState([]);
  const [igPages, setIgPages] = useState([]);
  const [loading, setLoading] = useState(false);

  const FACEBOOK_APP_ID = "544704651303656";

  // Load FB SDK
  useEffect(() => {
    if (window.FB) return;

    window.fbAsyncInit = function () {
      window.FB.init({
        appId: FACEBOOK_APP_ID,
        cookie: true,
        xfbml: true,
        version: "v18.0",
      });

      // Check login status
      window.FB.getLoginStatus((res) => {
        if (res.status === "connected") fetchPages(res.authResponse.accessToken);
      });
    };

    const js = document.createElement("script");
    js.id = "facebook-jssdk";
    js.src = "https://connect.facebook.net/en_US/sdk.js";
    document.body.appendChild(js);
  }, []);

  // Fetch both FB and IG pages
  const fetchPages = async (accessToken) => {
    try {
      setLoading(true);

      const res = await fetch(
        `https://graph.facebook.com/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${accessToken}`
      );
      const data = await res.json();

      if (!data?.data) return;

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

      if (!selectedPage && fbPagesData.length > 0) setSelectedPage(fbPagesData[0]);
      else if (!selectedPage && igPagesData.length > 0) setSelectedPage(igPagesData[0]);
    } catch (err) {
      console.error("Error fetching pages:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFBLogin = () => {
    if (!window.FB) return alert("FB SDK not loaded yet");

    window.FB.login(
      (res) => {
        if (res.authResponse) fetchPages(res.authResponse.accessToken);
        else console.log("FB login cancelled or failed");
      },
      { scope: "pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_manage_messages" }
    );
  };

  const handleConnectPage = (page) => {
    if (!setSelectedPage) return console.error("setSelectedPage not provided!");
    if (page.type === "instagram") setSelectedPage({ ...page, id: page.igId });
    else setSelectedPage(page);
  };

  const isConnected = (page) => selectedPage && (selectedPage.id === page.id || selectedPage.id === page.igId);

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
                {isConnected(p) ? "✅ Connected" : <button onClick={() => handleConnectPage(p)}>Connect</button>}
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
                {isConnected(p) ? "✅ Connected" : <button onClick={() => handleConnectPage(p)}>Connect</button>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
