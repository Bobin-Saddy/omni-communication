import { useEffect, useState } from "react";
import FacebookLogoutButton from "./FacebookLogoutButton";
import axios from "axios";

export default function Index() {
  const [users, setUsers] = useState([]);

  const facebookLoginUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${
    import.meta.env.VITE_FACEBOOK_APP_ID
  }&redirect_uri=${
    import.meta.env.VITE_FB_REDIRECT_URI
  }&scope=email,public_profile,pages_messaging,pages_show_list`;

  useEffect(() => {
    const handleMessage = async (event) => {
      if (event.data === "facebook-login-success") {
        console.log("Facebook connected successfully!");
        // Fetch users from your server
        const res = await axios.get("/api/facebook/conversations");
        setUsers(res.data);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const openFacebookLogin = () => {
    const width = 600;
    const height = 700;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;

    window.open(
      facebookLoginUrl,
      "fbLogin",
      `width=${width},height=${height},top=${top},left=${left},popup=yes`
    );
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Facebook Connect Demo</h1>

      <button
        onClick={openFacebookLogin}
        style={{
          padding: "10px 20px",
          backgroundColor: "#4267B2",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          marginRight: "10px",
        }}
      >
        Connect with Facebook
      </button>

      <FacebookLogoutButton />

      <h2>Connected Users</h2>
      <ul>
        {users.map((user) => (
          <li key={user.id}>
            {user.name || user.id}
          </li>
        ))}
      </ul>
    </div>
  );
}
