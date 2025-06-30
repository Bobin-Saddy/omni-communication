import { useEffect } from "react";
import FacebookLogoutButton from "./FacebookLogoutButton";

export default function Index() {
const facebookLoginUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${
  import.meta.env.VITE_FACEBOOK_APP_ID
}&redirect_uri=${
  import.meta.env.VITE_FB_REDIRECT_URI
}&scope=email,public_profile
&auth_type=reauthenticate`;


  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data === "facebook-login-success") {
        console.log("Facebook connected successfully!");
        // You can refresh user state or refetch data here
        window.location.reload();
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
    </div>
  );
}
