import { useEffect, useState } from "react";
import FacebookLogoutButton from "./FacebookLogoutButton";
import { fetchPageConversations } from "./app.fetchconversation";

export default function Index() {
  const [conversations, setConversations] = useState([]);

const facebookLoginUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${
  import.meta.env.VITE_FACEBOOK_APP_ID
}&redirect_uri=${
  import.meta.env.VITE_FB_REDIRECT_URI
}&scope=email,public_profile`; // removed pages_show_list,pages_messaging for testing


  const pageAccessToken = "EAAPOofzfZCvsBPG7BbILJUN9AYccsfchSWsoWnSgcCOYhQKK9KDDRfmP8W2YsTQKYER8fJGmXBRZBlPPAXhl6Orm9ryczx4D8nZAVr6S9LsNizVrWU3C5a46tiZBhXlQ3cCIw462OeH3oM2DCkDwT6tKGSFSp6DOXYvJhCztCrVIjftlZBAUcxOYvo12NnqIivyb6Q7Ny5MXFb5hIU2mUM3OqdL8udZCxzuRe3BPuPtZBdmrwEZD"; // Replace with your actual token
  const pageId = "494204937298187"; // Replace with your Page ID

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data === "facebook-login-success") {
        console.log("Facebook connected successfully!");
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

  const loadConversations = async () => {
    try {
      const data = await fetchPageConversations(pageAccessToken, pageId);
      console.log("Conversations data: ", data);
      setConversations(data.data);
    } catch (error) {
      console.error("Error fetching conversations: ", error);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

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

      <h2 style={{ marginTop: "30px" }}>Connected Users:</h2>
      <ul>
        {conversations.map((conv) => (
          <li key={conv.id}>
            {conv.participants.data
              .map((p) => p.name)
              .join(", ")}{" "}
            ({conv.message_count} messages)
          </li>
        ))}
      </ul>
    </div>
  );
}
