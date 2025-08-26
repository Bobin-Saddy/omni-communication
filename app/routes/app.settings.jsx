import { useState, useEffect } from "react";

export default function Settings({ onPageSelect }) {
  const [fbPages, setFbPages] = useState([]);
  const [igPages, setIgPages] = useState([]);
  const [fbConnected, setFbConnected] = useState(false);
  const [igConnected, setIgConnected] = useState(false);
  const [waConnected, setWaConnected] = useState(false);
  const [widgetConnected, setWidgetConnected] = useState(false);
  const [pageAccessTokens, setPageAccessTokens] = useState({});

  const FACEBOOK_APP_ID = "544704651303656";

  // Init FB SDK
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

  // -----------------------------
  // Connect functions
  const handleFacebookLogin = () => {
    window.FB.login(
      async (res) => {
        if (res.authResponse) {
          const accessToken = res.authResponse.accessToken;
          setFbConnected(true);
          const pagesRes = await fetch(
            `https://graph.facebook.com/me/accounts?fields=access_token,name,id&access_token=${accessToken}`
          );
          const data = await pagesRes.json();
          const tokens = {};
          const pages = data.data.map((p) => {
            tokens[p.id] = p.access_token;
            return p;
          });
          setPageAccessTokens((prev) => ({ ...prev, ...tokens }));
          setFbPages(pages);
        }
      },
      { scope: "pages_show_list,pages_messaging,pages_read_engagement,pages_manage_posts" }
    );
  };

  const handleInstagramLogin = () => {
    window.FB.login(
      async (res) => {
        if (res.authResponse) {
          const accessToken = res.authResponse.accessToken;
          setIgConnected(true);
          const pagesRes = await fetch(
            `https://graph.facebook.com/me/accounts?fields=access_token,name,id,instagram_business_account&access_token=${accessToken}`
          );
          const data = await pagesRes.json();
          const igPagesFiltered = data.data.filter((p) => p.instagram_business_account);
          const tokens = {};
          const pages = igPagesFiltered.map((p) => {
            tokens[p.id] = p.access_token;
            return { ...p, igId: p.instagram_business_account.id };
          });
          setPageAccessTokens((prev) => ({ ...prev, ...tokens }));
          setIgPages(pages);
        }
      },
      {
        scope:
          "pages_show_list,instagram_basic,instagram_manage_messages,pages_read_engagement,pages_manage_metadata",
      }
    );
  };

  const handleWhatsAppConnect = () => {
    setWaConnected(true);
  };

  const handleWidgetConnect = () => {
    setWidgetConnected(true);
  };

  // -----------------------------
  // When user clicks a page "Connect" button
  const connectPage = (page, type) => {
    if (onPageSelect) {
      onPageSelect({ ...page, type });
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Connect Platforms</h2>

      <div style={{ marginBottom: 20 }}>
        <button onClick={handleFacebookLogin} className="btn-primary">
          {fbConnected ? "Facebook Connected" : "Connect Facebook"}
        </button>
      </div>

      <div style={{ marginBottom: 20 }}>
        <button onClick={handleInstagramLogin} className="btn-primary">
          {igConnected ? "Instagram Connected" : "Connect Instagram"}
        </button>
      </div>

      <div style={{ marginBottom: 20 }}>
        <button onClick={handleWhatsAppConnect} className="btn-primary">
          {waConnected ? "WhatsApp Connected" : "Connect WhatsApp"}
        </button>
      </div>

      <div style={{ marginBottom: 20 }}>
        <button onClick={handleWidgetConnect} className="btn-primary">
          {widgetConnected ? "Widget Connected" : "Connect Widget"}
        </button>
      </div>

      {/* Show Connected Pages */}
      {fbPages.length > 0 && (
        <div>
          <h3>Facebook Pages</h3>
          {fbPages.map((p) => (
            <div key={p.id} style={{ marginBottom: 10 }}>
              <span>{p.name}</span>
              <button
                style={{ marginLeft: 10 }}
                className="btn-primary"
                onClick={() => connectPage(p, "facebook")}
              >
                Connect Page
              </button>
            </div>
          ))}
        </div>
      )}

      {igPages.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h3>Instagram Pages</h3>
          {igPages.map((p) => (
            <div key={p.id} style={{ marginBottom: 10 }}>
              <span>{p.name}</span>
              <button
                style={{ marginLeft: 10 }}
                className="btn-primary"
                onClick={() => connectPage(p, "instagram")}
              >
                Connect Page
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
