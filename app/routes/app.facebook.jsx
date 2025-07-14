import { useState, useEffect } from "react";

export default function FacebookPageMessages() {
  const [isConnected, setIsConnected] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [pageAccessToken, setPageAccessToken] = useState(null);
  const [pageId, setPageId] = useState(null);

  // Your App ID
  const FACEBOOK_APP_ID = "1071620057726715";

  // Load Facebook SDK
  useEffect(() => {
    window.fbAsyncInit = function () {
      window.FB.init({
        appId: FACEBOOK_APP_ID,
        cookie: true,
        xfbml: true,
        version: "v18.0",
      });
    };

    (function (d, s, id) {
      var js,
        fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) {
        return;
      }
      js = d.createElement(s);
      js.id = id;
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      fjs.parentNode.insertBefore(js, fjs);
    })(document, "script", "facebook-jssdk");
  }, []);

  // Facebook login
  const handleFacebookLogin = () => {
    window.FB.login(
      function (response) {
        if (response.authResponse) {
          console.log("Welcome! Fetching your info.... ", response);
          fetchPageDetails(response.authResponse.accessToken);
        } else {
          console.log("User cancelled login or did not fully authorize.");
        }
      },
      { scope: "pages_show_list,pages_read_engagement,pages_manage_metadata,pages_messaging" }
    );
  };

  // Fetch Page ID and Access Token
  const fetchPageDetails = (userAccessToken) => {
    fetch(
      `https://graph.facebook.com/me/accounts?access_token=${userAccessToken}`
    )
      .then((res) => res.json())
      .then((data) => {
        console.log("Pages:", data);
        if (data.data && data.data.length > 0) {
          const firstPage = data.data[0];
          setPageId(firstPage.id);
          setPageAccessToken(firstPage.access_token);
          setIsConnected(true);
          fetchPageConversations(firstPage.id, firstPage.access_token);
        } else {
          console.log("No pages found for this user.");
        }
      })
      .catch((err) => console.error("Error fetching page details:", err));
  };

  // Fetch all conversations of the page
  const fetchPageConversations = async (PAGE_ID, PAGE_ACCESS_TOKEN) => {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v20.0/${PAGE_ID}/conversations?access_token=${PAGE_ACCESS_TOKEN}`
      );
      const data = await response.json();
      console.log("Page Conversations:", data);
      setConversations(data.data || []);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    }
  };

  // Fetch messages of a particular conversation
  const fetchMessages = async (conversationId) => {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v20.0/${conversationId}/messages?access_token=${pageAccessToken}`
      );
      const data = await response.json();
      console.log("Conversation Messages:", data);
      setMessages(data.data || []);
      setSelectedConversation(conversationId);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>📥 Facebook Page Conversations</h2>

      {!isConnected && (
        <button
          onClick={handleFacebookLogin}
          style={{
            padding: "10px 20px",
            backgroundColor: "#4267B2",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Connect with Facebook
        </button>
      )}

      {isConnected && conversations.length === 0 && <p>No conversations found.</p>}

      {isConnected && (
        <ul>
          {conversations.map((conv) => (
            <li key={conv.id}>
              <button
                onClick={() => fetchMessages(conv.id)}
                style={{
                  padding: "8px 12px",
                  margin: "5px",
                  backgroundColor: "#4267B2",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                }}
              >
                View Conversation {conv.id}
              </button>
            </li>
          ))}
        </ul>
      )}

      {selectedConversation && (
        <div style={{ marginTop: "30px" }}>
          <h3>Messages in Conversation</h3>
          {messages.length === 0 && <p>No messages found.</p>}

          <ul>
            {messages.map((msg) => (
              <li key={msg.id}>
                <strong>{msg.from?.name || "Unknown"}:</strong> {msg.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
