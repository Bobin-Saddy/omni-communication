import { json, redirect } from "@remix-run/node";
import axios from "axios";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return json({ error: "No code returned from Facebook" }, { status: 400 });
  }

  try {
    // Exchange code for access token
    const tokenResponse = await axios.get(
      `https://graph.facebook.com/v18.0/oauth/access_token`, {
        params: {
          client_id: process.env.VITE_FACEBOOK_APP_ID,
          client_secret: process.env.FACEBOOK_APP_SECRET,
          redirect_uri: process.env.VITE_FB_REDIRECT_URI,
          code: code,
        },
      }
    );

    const accessToken = tokenResponse.data.access_token;

    // Fetch user profile
    const userProfileResponse = await axios.get(
      `https://graph.facebook.com/me`, {
        params: {
          fields: 'id,name,email',
          access_token: accessToken,
        },
      }
    );

    const userProfile = userProfileResponse.data;

    console.log("Facebook user profile:", userProfile);

    // TODO: Save userProfile to your DB or create session here

    // Redirect to success page or close popup
    return redirect("/facebook-success"); // adjust to your success page route

  } catch (error) {
    console.error("Facebook callback error:", error);
    return json({ error: "Facebook login failed" }, { status: 500 });
  }
};

export default function Callback() {
  return (
    <div>
      <p>Processing Facebook login...</p>
    </div>
  );
}
