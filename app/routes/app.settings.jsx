import { useEffect } from "react";

export default function Settings({ selectedPage, setSelectedPage, fbPages, setFbPages, igPages, setIgPages }) {
  const FACEBOOK_APP_ID = "544704651303656";

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

  const fetchFBPages = async (accessToken) => {
    try {
      const res = await fetch(
        `https://graph.facebook.com/me/accounts?fields=id,name,access_token&access_token=${accessToken}`
      );
      const data = await res.json();
      if (!Array.isArray(data?.data)) return;

      setFbPages(data.data.map((p) => ({ ...p, type: "facebook" })));
      setSelectedPage(data.data[0]);
    } catch (err) {
      console.error("Error fetching FB pages:", err);
    }
  };

  const fetchIGPages = async (accessToken) => {
    try {
      const res = await fetch(
        `https://graph.facebook.com/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${accessToken}`
      );
      const data = await res.json();
      if (!Array.isArray(data?.data)) return;

      const igAccounts = data.data.filter((p) => p.instagram_business_account);
      if (!igAccounts.length) return;

      const enriched = igAccounts.map((p) => ({
        ...p,
        type: "instagram",
        igId: p.instagram_business_account.id,
      }));

      setIgPages(enriched);
      setSelectedPage(enriched[0]);
    } catch (err) {
      console.error("Error fetching IG pages:", err);
    }
  };

  const handleFBLogin = () => {
    if (!window.FB) return console.error("FB SDK not loaded yet");

    window.FB.login(
      (res) => {
        if (res.authResponse) fetchFBPages(res.authResponse.accessToken);
      },
      { scope: "pages_show_list,pages_messaging,pages_read_engagement,pages_manage_posts" }
    );
  };

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

  return (
    <div style={{ padding: 20 }}>
      <h2>Settings</h2>

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button onClick={handleFBLogin}>Login Facebook</button>
        <button onClick={handleIGLogin}>Login Instagram</button>
      </div>

      {fbPages.length > 0 && (
        <div>
          <h3>Facebook Pages</h3>
          <ul>
            {fbPages.map((page) => (
              <li key={page.id}>
                {page.name}{" "}
                <button onClick={() => setSelectedPage(page)}>Connect</button>
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
                <button onClick={() => setSelectedPage(page)}>Connect</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
