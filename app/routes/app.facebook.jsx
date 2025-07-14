import { useState, useEffect } from "react";
import { Page, Card, Button, Text } from "@shopify/polaris";

export default function FacebookPageMessages() {
  const [isConnected, setIsConnected] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [pageAccessToken, setPageAccessToken] = useState(null);
  const [pageId, setPageId] = useState(null);

  const FACEBOOK_APP_ID = "1071620057726715";

  // ✅ Initialize Facebook SDK
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
      if (d.getElementById(id)) return;
      js = d.createElement(s);
      js.id = id;
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      fjs.parentNode.insertBefore(js, fjs);
    })(document, "script", "facebook-jssdk");
  }, []);

  // ✅ Handle Facebook login
  const handleFacebookLogin = () => {
    window.FB.login(
      function (response) {
        if (response.authResponse) {
          console.log("✅ Facebook login successful:", response);
          fetchPageDetails(response.authResponse.accessToken);
        } else {
          console.log("❌ User cancelled login or did not fully authorize.");
        }
      },
      {
        scope:
          "pages_show_list,pages_read_engagement,pages_manage_metadata,pages_messaging",
      }
    );
  };

  // ✅ Fetch user's page details
  const fetchPageDetails = (userAccessToken) => {
    fetch(
      `https://graph.facebook.com/me/accounts?access_token=${userAccessToken}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.data && data.data.length > 0) {
          const firstPage = data.data[0];
          setPageId(firstPage.id);
          setPageAccessToken(firstPage.access_token);
          setIsConnected(true);
          fetchPageConversations(firstPage.id, firstPage.access_token);
        } else {
          console.log("❌ No pages found for this user.");
        }
      })
      .catch((err) => console.error("Error fetching page details:", err));
  };

  // ✅ Fetch all conversations for the page with pagination
  const fetchPageConversations = async (PAGE_ID, PAGE_ACCESS_TOKEN, nextURL = null) => {
    try {
      const url = nextURL || `https://graph.facebook.com/v20.0/${PAGE_ID}/conversations?limit=100&access_token=${PAGE_ACCESS_TOKEN}`;
      const response = await fetch(url);
      const data = await response.json();

      // Append new conversations to existing state
      setConversations(prev => [...prev, ...(data.data || [])]);

      // If there's another page, fetch it recursively
      if (data.paging && data.paging.next) {
        await fetchPageConversations(PAGE_ID, PAGE_ACCESS_TOKEN, data.paging.next);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    }
  };

  // ✅ Fetch messages in a conversation
  const fetchMessages = async (conversationId) => {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v20.0/${conversationId}/messages?fields=message,from&access_token=${pageAccessToken}`
      );
      const data = await response.json();
      console.log("✅ Messages fetched:", data);
      setMessages(data.data || []);
      setSelectedConversation(conversationId);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  // ✅ Render UI
  return (
    <Page title="Facebook Page Messages">
      <Card sectioned>
        {!isConnected && (
          <Button onClick={handleFacebookLogin} primary>
            Connect with Facebook
          </Button>
        )}

        {isConnected && conversations.length === 0 && (
          <Text>No conversations found.</Text>
        )}

        {isConnected && conversations.length > 0 && (
          <>
            <Text variant="headingMd">Conversations</Text>
            {conversations.map((conv) => (
              <Button
                key={conv.id}
                onClick={() => fetchMessages(conv.id)}
                style={{ margin: "5px" }}
              >
                View Conversation {conv.id}
              </Button>
            ))}
          </>
        )}

        {selectedConversation && (
          <div style={{ marginTop: "30px" }}>
            <Text variant="headingMd">Messages</Text>
            {messages.length === 0 && <Text>No messages found.</Text>}

            <ul>
              {messages.map((msg) => (
                <li key={msg.id}>
                  <strong>
                    {msg.from?.name || msg.from?.id || "Anonymous"}:
                  </strong>{" "}
                  {msg.message}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>
    </Page>
  );
}
