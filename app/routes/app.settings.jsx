import React from "react";


export default function Settings({
fbConnected,
igConnected,
waConnected,
widgetConnected,
handleFacebookLogin,
handleInstagramLogin,
handleWhatsAppConnect,
handleWidgetConnect,
}) {
return (
<div style={{ textAlign: "center" }}>
<button onClick={handleFacebookLogin} disabled={fbConnected} className="btn-primary">
{fbConnected ? "✅ Facebook Connected" : "🔵 Connect Facebook"}
</button>
<br />
<button onClick={handleInstagramLogin} disabled={igConnected} className="btn-primary">
{igConnected ? "✅ Instagram Connected" : "📸 Connect Instagram"}
</button>
<br />
<button onClick={handleWhatsAppConnect} disabled={waConnected} className="btn-primary">
{waConnected ? "✅ WhatsApp Connected" : "💬 Connect WhatsApp"}
</button>
<br />
<button onClick={handleWidgetConnect} disabled={widgetConnected} className="btn-primary">
{widgetConnected ? "✅ Widget Connected" : "🧩 Connect Widget"}
</button>
</div>
);
}