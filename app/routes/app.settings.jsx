import { useState } from "react";

export default function Settings({
  selectedPage,
  setSelectedPage,
  fbPages,
  setFbPages,
  igPages,
  setIgPages,
}) {
  const [loadingFB, setLoadingFB] = useState(false);
  const [loadingIG, setLoadingIG] = useState(false);

  // Facebook login & fetch pages
  const handleFacebookLogin = () => {
    if (!window.FB) return alert("FB SDK not loaded");

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
              setFbPages(
                pagesData.data.map((p) => ({ ...p, type: "facebook" }))
              );
            }
          } catch (err) {
            console.error("Error fetching FB pages:", err);
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

  // Instagram login & fetch pages
  const handleInstagramLogin = () => {
    if (!window.FB) return alert("FB SDK not loaded");

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
              // Filter only pages with connected IG business accounts
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
            }
          } catch (err) {
            console.error("Error fetching IG pages:", err);
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
          {fbPages.map((p) => (
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
          {igPages.map((p) => (
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
