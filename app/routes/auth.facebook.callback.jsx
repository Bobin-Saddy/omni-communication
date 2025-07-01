import express from "express";
import axios from "axios";

const router = express.Router();

router.get("/facebook/callback", async (req, res) => {
  const { code } = req.query;

  try {
    // Exchange code for access token
    const tokenRes = await axios.get(
      `https://graph.facebook.com/v18.0/oauth/access_token`, {
        params: {
          client_id: process.env.FB_APP_ID,
          redirect_uri: process.env.FB_REDIRECT_URI,
          client_secret: process.env.FB_APP_SECRET,
          code,
        },
      }
    );

    const accessToken = tokenRes.data.access_token;

    // Fetch user profile
    const userRes = await axios.get(
      `https://graph.facebook.com/me?fields=id,name,email&access_token=${accessToken}`
    );

    const fbUser = userRes.data; // { id, name, email }

    // Fetch user chat data from DB using fbUser.id
    const userChats = await getChatsByFacebookId(fbUser.id); // Implement this DB function

    // Send user and chat data to frontend
    res.json({
      user: fbUser,
      chats: userChats,
    });

  } catch (err) {
    console.error("Facebook login error:", err.response?.data || err);
    res.status(500).json({ error: "Facebook login failed" });
  }
});

export default router;
