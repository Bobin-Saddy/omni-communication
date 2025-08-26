import { useState, useEffect } from "react";

export default function Settings({ selectedPage, setSelectedPage, fbPages = [], setFbPages, igPages = [], setIgPages }) {
  const [loading, setLoading] = useState(false);
  const [fbSdkLoaded, setFbSdkLoaded] = useState(false);

  // Load Facebook SDK
  useEffect(() => {
    if (window.FB) {
      setFbSdkLoaded(true);
      return;
    }
    window.fbAsyncInit = function () {
      window.FB.init({
        appId: "544704651303656", // replace with your FB App ID
        cookie: true,
        xfbml: true,
        version: "v18.0",
      });
      setFbSdkLoaded(true);
    };

    (function (d, s, id) {
      let js,
        fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) return;
      js = d.createElement(s);
      js.id = id;
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      fjs.parentNode.insertBefore(js, fjs);
    })(document, "script", "facebook-jssdk");
  }, []);

  const handleFBLogin = () => {
    if (!fbSdkLoaded) return alert("FB SDK not loaded yet");
    setLoading(true);

    window.FB.login(
      async (res) => {
        if (res.authResponse) {
          const token = res.authResponse.accessToken;
          try {
            const pagesRes = await fetch(
              `https://graph.facebook.com/v18.0/me/accounts?fields=name,instagram_business_account&access_token=${token}`
            );
            const pagesData = await pagesRes.json();
            if (Array.isArray(pagesData.data)) {
              const fbPagesData = [];
              const igPagesData = [];

              pagesData.data.forEach((p) => {
                fbPagesData.push({ ...p, type: "facebook", access_token: token });
                if (p.instagram_business_account) {
                  igPagesData.push({
                    id: p.instagram_business_account.id,
                    name: p.name,
                    access_token: token,
                    type: "instagram",
                    igId: p.instagram_business_account.id,
                  });
                }
              });

              setFbPages(fbPagesData);
              setIgPages(igPagesData);
            } else {
              setFbPages([]);
              setIgPages([]);
            }
          } catch (err) {
            console.error("Error fetching pages:", err);
            setFbPages([]);
            setIgPages([]);
          } finally {
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      },
      { scope: "pages_show_list,instagram_basic,pages_read_engagement" }
    );
  };

  return (
    <div style={{ marginTop: 20 }}>
      <h2>Settings</h2>
      <div style={{ marginTop: 10 }}>
        <button onClick={handleFBLogin} disabled={loading}>
          {loading ? "Loading..." : "Connect Facebook / Instagram"}
        </button>

        <h3>Facebook Pages</h3>
        <ul>
          {Array.isArray(fbPages) &&
            fbPages.map((p) => (
              <li key={p.id}>
                {p.name}{" "}
                <button onClick={() => setSelectedPage(p)}>
                  {selectedPage?.id === p.id ? "Connected" : "Connect"}
                </button>
              </li>
            ))}
        </ul>

        <h3>Instagram Pages</h3>
        <ul>
          {Array.isArray(igPages) &&
            igPages.map((p) => (
              <li key={p.id}>
                {p.name}{" "}
                <button onClick={() => setSelectedPage(p)}>
                  {selectedPage?.id === p.id ? "Connected" : "Connect"}
                </button>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}
