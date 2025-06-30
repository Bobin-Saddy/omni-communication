// Example: app/routes/api/facebook/callback.jsx

import { json, redirect } from "@remix-run/node";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  // Exchange code for access token
  const tokenRes = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?client_id=${process.env.VITE_FACEBOOK_APP_ID}&redirect_uri=${process.env.VITE_FB_REDIRECT_URI}&client_secret=${process.env.FACEBOOK_APP_SECRET}&code=${code}`);
  const tokenData = await tokenRes.json();

  const userAccessToken = tokenData.access_token;

  // Get user pages
  const pagesRes = await fetch(`https://graph.facebook.com/me/accounts?access_token=${userAccessToken}`);
  const pagesData = await pagesRes.json();

  console.log("Connected Pages:", pagesData);

  // Save page access token in DB for messaging
  const page = pagesData.data[0];
  const pageAccessToken = page.access_token;
  const pageId = page.id;

  // Save these securely in your database for future message APIs
  console.log("Page ID:", pageId, "Page Access Token:", pageAccessToken);

  return redirect("/?connected=true");
};

export default function Callback() {
  return <div>Connecting...</div>;
}
