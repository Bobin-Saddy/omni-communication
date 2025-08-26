import { useState, useEffect } from "react";

export default function Settings({ onPageSelect }) {
  const [fbPages, setFbPages] = useState([]);
  const [igPages, setIgPages] = useState([]);
  const [fbConnected, setFbConnected] = useState(false);
  const [igConnected, setIgConnected] = useState(false);
  const [waConnected, setWaConnected] = useState(false);
  const [widgetConnected, setWidgetConnected] = useState(false);

  const FACEBOOK_APP_ID = "544704651303656";

  // Load FB SDK
  useEffect(() => {
    if (window.FB) return; // already loaded

    window.fbAsyncInit = function () {
      window.FB.init({
        appId: FACEBOOK_APP_ID,
        cookie: true,
        xfbml: true,
        version: "v18.0",
      });
    };

    const js = document.createElement("script");
    js.id = "facebook-jssdk";
    js.src = "https://connect.facebook.net/en_US/sdk.js";
    document.body.appendChild(js);
  }, []);

  // -----------------------------
  // Facebook Connect
  const handleFacebookLogin = () => {
    if (!window.FB) return alert("Facebook SDK not loaded yet");

    window.FB.login(
      async (res) => {
        if (!res.authResponse) return;

        const userAccessToken = res.authResponse.accessToken;

        // Fetch pages
        const pagesRes = await fetch(
          `https://graph.facebook.com/me/accounts?fields=access_token,name,id&access_token=${userAccessToken}`
        );
        const data = await pagesRes.json();

        if (!data?.data?.length) return alert("No Facebook pages found.");

        const pages = data.data.map((p) => ({
          ...p,
          type: "facebook",
          token: p.access_token, // ✅ include page token
        }));

        setFbPages(pages);
        setFbConnected(true);

        // ✅ Auto-select first page
        onPageSelect && onPageSelect(pages[0]);
      },
      {
        scope:
          "pages_show_list,pages_messaging,pages_read_engagement,pages_manage_posts",
      }
    );
  };

  // -----------------------------
  // Instagram Connect
  const handleInstagramLogin = () => {
    if (!window.FB) return alert("Facebook SDK not loaded yet");

    window.FB.login(
      async (res) => {
        if (!res.authResponse) return;

        const userAccessToken = res.authResponse.accessToken;

        // Fetch IG business accounts
        const pagesRes = await fetch(
          `https://graph.facebook.com/me/accounts?fields=access_token,name,id,instagram_business_account&access_token=${userAccessToken}`
        );
        const data = await pagesRes.json();

        const igPagesFiltered = data.data.filter(
          (p) => p.instagram_business_account
        );
        if (!igPagesFiltered.length)
          return alert("No Instagram business accounts found.");

        const pages = igPagesFiltered.map((p) => ({
          ...p,
          type: "instagram",
          token: p.access_token, // ✅ include page token
          igId: p.instagram_business_account.id,
        }));

        setIgPages(pages);
        setIgConnected(true);

        // ✅ Auto-select first IG page
        onPageSelect && onPageSelect(pages[0]);
      },
      {
        scope:
          "pages_show_list,instagram_basic,instagram_manage_messages,pages_read_engagement,pages_manage_metadata",
      }
    );
  };

  // -----------------------------
  // WhatsApp + Widget placeholder
  const handleWhatsAppConnect = () => {
    setWaConnected(true);
    onPageSelect &&
      onPageSelect({ id: "whatsapp-1", name: "WhatsApp", type: "whatsapp" });
  };

  const handleWidgetConnect = () => {
    setWidgetConnected(true);
    onPageSelect &&
      onPageSelect({ id: "widget-1", name: "Chat Widget", type: "widget" });
  };

  // -----------------------------
  return (
    <div style={{ padding: 20 }}>
      <h2>Connect Platforms</h2>

      {/* Facebook */}
      <div style={{ marginBottom: 20 }}>
        <button onClick={handleFacebookLogin} className="btn-primary">
          {fbConnected ? "✅ Facebook Connected" : "Connect Facebook"}
        </button>
      </div>

      {/* Instagram */}
      <div style={{ marginBottom: 20 }}>
        <button onClick={handleInstagramLogin} className="btn-primary">
          {igConnected ? "✅ Instagram Connected" : "Connect Instagram"}
        </button>
      </div>

      {/* WhatsApp */}
      <div style={{ marginBottom: 20 }}>
        <button onClick={handleWhatsAppConnect} className="btn-primary">
          {waConnected ? "✅ WhatsApp Connected" : "Connect WhatsApp"}
        </button>
      </div>

      {/* Widget */}
      <div style={{ marginBottom: 20 }}>
        <button onClick={handleWidgetConnect} className="btn-primary">
          {widgetConnected ? "✅ Widget Connected" : "Connect Widget"}
        </button>
      </div>

      {/* Show Pages */}
      {fbPages.length > 0 && (
        <div>
          <h3>Facebook Pages</h3>
          {fbPages.map((p) => (
            <div key={p.id} style={{ marginBottom: 10 }}>
              <span>{p.name}</span>
              <button
                style={{ marginLeft: 10 }}
                className="btn-primary"
                onClick={() => onPageSelect && onPageSelect(p)}
              >
                Use This Page
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
                onClick={() => onPageSelect && onPageSelect(p)}
              >
                Use This IG Page
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
