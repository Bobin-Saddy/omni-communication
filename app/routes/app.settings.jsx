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
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold">Connect Your Channels</h2>

      <div className="flex flex-col gap-2">
        <button
          onClick={handleFacebookLogin}
          className="px-4 py-2 rounded bg-blue-600 text-white"
        >
          {fbConnected ? "✅ Facebook Connected" : "Connect Facebook"}
        </button>

        <button
          onClick={handleInstagramLogin}
          className="px-4 py-2 rounded bg-pink-600 text-white"
        >
          {igConnected ? "✅ Instagram Connected" : "Connect Instagram"}
        </button>

        <button
          onClick={handleWhatsAppConnect}
          className="px-4 py-2 rounded bg-green-600 text-white"
        >
          {waConnected ? "✅ WhatsApp Connected" : "Connect WhatsApp"}
        </button>

        <button
          onClick={handleWidgetConnect}
          className="px-4 py-2 rounded bg-gray-700 text-white"
        >
          {widgetConnected ? "✅ Widget Connected" : "Connect Widget"}
        </button>
      </div>
    </div>
  );
}
