import { useEffect, useState } from "react";
import FacebookLogoutButton from "./FacebookLogoutButton";

export default function Index() {
  const [fbUser, setFbUser] = useState(null);
  const [chats, setChats] = useState([]);

  useEffect(() => {
    // Check if URL has fb code after redirect
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (code) {
      fetch(`/api/facebook/callback?code=${code}`)
        .then((res) => res.json())
        .then((data) => {
          setFbUser(data.user);
          setChats(data.chats);
        })
        .catch((err) => console.error("Failed to fetch FB user data", err));
    }
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

      {fbUser && (
        <div>
          <h2>Welcome, {fbUser.name}</h2>
          <p>Facebook ID: {fbUser.id}</p>

          <h3>Your Chat History:</h3>
          <ul>
            {chats.map((chat, index) => (
              <li key={index}>{chat.message}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
