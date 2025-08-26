import { useState, useEffect } from "react";

export default function Settings({ selectedPage, setSelectedPage, fbPages = [], setFbPages, igPages = [], setIgPages }) {
  const [loadingFB, setLoadingFB] = useState(false);
  const [loadingIG, setLoadingIG] = useState(false);
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
      var js,
        fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) {
        return;
      }
      js = d.createElement(s);
      js.id = id;
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      fjs.parentNode.insertBefore(js, fjs);
    })(document, "script", "facebook-jssdk");
  }, []);

  const handleFacebookLogin = () => {
    if (!fbSdkLoaded) return alert("FB SDK not loaded yet");
    setLoadingFB(true);

    window.FB.login(
      async (res) => {
        if (res.authResponse) {
          try {
            const token = res.authResponse.accessToken;
            const pagesRes = await fetch(
              `https://graph.facebook.com/v18.0/me/accounts?access_token=${token}`
            );
            const pagesData = await pagesRes.json();
            if (Array.isArray(pagesData.data)) {
              setFbPages(pagesData.data.map((p) => ({ ...p, type: "facebook", access_token: token })));
            } else {
              setFbPages([]);
            }
          } catch (err) {
            console.error("Error fetching FB pages:", err);
            setFbPages([]);
          } finally {
            setLoadingFB(false);
          }
        } else {
          setLoadingFB(false);
        }
      },
      { scope: "pages_show_list,pages_read_engagement" }
    );
  };

  const handleInstagramLogin = () => {
    if (!fbSdkLoaded) return alert("FB SDK not loaded yet");
    setLoadingIG(true);

    window.FB.login(
      async (res) => {
        if (res.authResponse) {
          try {
            const token = res.authResponse.accessToken;
            const igRes = await fetch(
              `https://graph.facebook.com/v18.0/me/accounts?access_token=${token}`
            );
            const igData = await igRes.json();
            if (Array.isArray(igData.data)) {
              const igPagesData = igData.data
                .filter((p) => p.instagram_business_account)
                .map((p) => ({
                  id: p.instagram_business_account.id,
                  name: p.name,
                  access_token: token,
                  type: "instagram",
                  igId: p.instagram_business_account.id,
                }));
              setIgPages(igPagesData);
            } else {
              setIgPages([]);
            }
          } catch (err) {
            console.error("Error fetching IG pages:", err);
            setIgPages([]);
          } finally {
            setLoadingIG(false);
          }
        } else {
          setLoadingIG(false);
        }
      },
      { scope: "pages_show_list,instagram_basic,pages_read_engagement" }
    );
  };

  return (
    <div style={{ marginTop: 20 }}>
      <h2>Settings</h2>

      <div style={{ marginTop: 10 }}>
        <button onClick={handleFacebookLogin} disabled={loadingFB}>
          {loadingFB ? "Loading FB..." : "Connect Facebook"}
        </button>
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
      </div>

      <div style={{ marginTop: 20 }}>
        <button onClick={handleInstagramLogin} disabled={loadingIG}>
          {loadingIG ? "Loading IG..." : "Connect Instagram"}
        </button>
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
