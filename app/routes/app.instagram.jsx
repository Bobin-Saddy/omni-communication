import { useState, useEffect } from "react";
import { Page, Card, Button, Text } from "@shopify/polaris";

export default function InstagramChatProcessor() {
  const [isConnected, setIsConnected] = useState(false);
  const [instagramAccounts, setInstagramAccounts] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  const FACEBOOK_APP_ID = "544704651303656";

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

const handleInstagramLogin = () => {
  window.FB.login(
    (response) => {
      if (response.authResponse) {
        console.log("Auth response", response);
        fetchInstagramAccounts(response.authResponse.accessToken);
      } else {
        console.log("User cancelled login or did not fully authorize.");
      }
    },
    {
      scope:
        "instagram_basic,instagram_manage_messages,pages_show_list,pages_read_engagement,pages_manage_metadata,pages_messaging",
    }
  );
};


const fetchInstagramAccounts = (userAccessToken) => {
  fetch(
    `https://graph.facebook.com/me/accounts?fields=instagram_business_account&access_token=${userAccessToken}`
  )
    .then((res) => res.json())
    .then((data) => {
      const accounts = data.data
        .filter((page) => page.instagram_business_account)
        .map((page) => ({
          pageId: page.id,
          igId: page.instagram_business_account.id,
          pageAccessToken: page.access_token, // ADD THIS LINE
        }));

      setInstagramAccounts(accounts);
      setIsConnected(true);
    })
    .catch((err) => console.error("Error fetching Instagram accounts:", err));
};

  const fetchConversations = (igId, pageAccessToken) => {
    fetch(
      `https://graph.facebook.com/v18.0/${igId}/conversations?platform=instagram&access_token=${pageAccessToken}`
    )
      .then((res) => res.json())
      .then((data) => setConversations(data.data || []))
      .catch((err) => console.error("Error fetching conversations:", err));
  };

  const fetchMessages = (threadId, pageAccessToken) => {
    fetch(
      `https://graph.facebook.com/v18.0/${threadId}/messages?access_token=${pageAccessToken}`
    )
      .then((res) => res.json())
      .then((data) => setMessages(data.data.reverse()))
      .catch((err) => console.error("Error fetching messages:", err));
  };

  const sendMessage = (threadId, pageAccessToken) => {
    if (!newMessage.trim()) return;

    fetch(
      `https://graph.facebook.com/v18.0/${threadId}/messages`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: { text: newMessage },
        }),
        params: {
          access_token: pageAccessToken,
        },
      }
    )
      .then((res) => res.json())
      .then((data) => {
        console.log("Message sent:", data);
        setNewMessage("");
        fetchMessages(threadId, pageAccessToken);
      })
      .catch((err) => console.error("Error sending message:", err));
  };

  return (
    <Page title="💬 Instagram Chat Processor">
      <Card sectioned>
        {!isConnected ? (
          <Button onClick={handleInstagramLogin} primary>
            Connect with Instagram
          </Button>
        ) : (
          <div>
            <Text variant="headingMd">Instagram Accounts</Text>
            {instagramAccounts.map((acc) => (
              <div key={acc.igId}>
                <Text>Instagram ID: {acc.igId}</Text>
                <Button
                  onClick={() =>
                    fetchConversations(acc.igId, acc.pageAccessToken)
                  }
                  size="slim"
                  style={{ marginTop: "10px" }}
                >
                  View Conversations
                </Button>
              </div>
            ))}

            {conversations.length > 0 && (
              <div style={{ marginTop: "20px" }}>
                <Text variant="headingMd">Conversations</Text>
                {conversations.map((conv) => (
                  <div key={conv.id}>
                    <Text>Thread ID: {conv.id}</Text>
                    <Button
                      onClick={() =>
                        fetchMessages(conv.id, instagramAccounts[0].pageAccessToken)
                      }
                      size="slim"
                    >
                      View Messages
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {messages.length > 0 && (
              <div style={{ marginTop: "20px" }}>
                <Text variant="headingMd">Messages</Text>
                {messages.map((msg) => (
                  <div key={msg.id}>
                    <Text>{msg.message}</Text>
                  </div>
                ))}

                <div style={{ marginTop: "10px" }}>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                  />
                  <Button
                    onClick={() =>
                      sendMessage(
                        selectedConversation.id,
                        instagramAccounts[0].pageAccessToken
                      )
                    }
                  >
                    Send
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </Page>
  );
}
