
import axios from "axios";

app.get("/fb/callback", async (req, res) => {
  const code = req.query.code;

  const { data } = await axios.get(
    `https://graph.facebook.com/v18.0/oauth/access_token`, {
      params: {
        client_id: process.env.VITE_FACEBOOK_APP_ID,
        client_secret: process.env.FB_APP_SECRET,
        redirect_uri: process.env.VITE_FB_REDIRECT_URI,
        code,
      },
    }
  );

  const accessToken = data.access_token;

  // Optionally save this token in DB/session for future Graph API calls
  res.send(`<script>
    window.opener.postMessage('facebook-login-success', '*');
    window.close();
  </script>`);
});