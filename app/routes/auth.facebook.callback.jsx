import { json } from "@remix-run/node";
import axios from "axios";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return json({ error: "No code returned from Facebook" }, { status: 400 });
  }

  try {
    // 1. Exchange code for access token
    const tokenResponse = await axios.get(
      `https://graph.facebook.com/v18.0/oauth/access_token`,
      {
        params: {
          client_id: process.env.VITE_FACEBOOK_APP_ID,
          client_secret: process.env.FACEBOOK_APP_SECRET,
          redirect_uri: process.env.VITE_FB_REDIRECT_URI,
          code: code,
        },
      }
    );

    const accessToken = tokenResponse.data.access_token;

    // 2. Fetch user profile using the access token
    const userProfileResponse = await axios.get(
      `https://graph.facebook.com/me`,
      {
        params: {
          fields: "id,name,email",
          access_token: accessToken,
        },
      }
    );

    const userProfile = userProfileResponse.data;
    console.log("✅ Facebook user profile:", userProfile);

    // 3. (Recommended) Fetch pages of user to get page access token if needed
    const pagesResponse = await axios.get(
      `https://graph.facebook.com/me/accounts`,
      {
        params: {
          access_token: accessToken,
        },
      }
    );
    console.log("✅ User pages:", pagesResponse.data);

    // 4. TODO: Save userProfile and accessToken to DB or create session here

    // 5. Return HTML that posts a success message to opener and closes the popup
    return new Response(
      `
      <html>
        <body>
          <script>
            window.opener.postMessage("facebook-login-success", "*");
            window.close();
          </script>
          <p>Facebook login successful. You can close this window.</p>
        </body>
      </html>
    `,
      {
        headers: { "Content-Type": "text/html" },
      }
    );
  } catch (error) {
    console.error("❌ Facebook callback error:", error?.response?.data || error);
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
