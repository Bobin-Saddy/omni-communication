// app/routes/index.jsx

import { json, redirect } from "@remix-run/node";
import { useLoaderData, Form } from "@remix-run/react";
import { useEffect } from "react";

export const loader = async () => {
  // 🔴 Replace with your DB fetching logic
  const pageAccessToken = "YOUR_STORED_PAGE_ACCESS_TOKEN";
  const pageId = "YOUR_PAGE_ID";

  if (!pageAccessToken) {
    return json({ messages: [] });
  }

  const messagesRes = await fetch(
    `https://graph.facebook.com/${pageId}/conversations?fields=messages{message,from,created_time}&access_token=${pageAccessToken}`
  );
  const messagesData = await messagesRes.json();

  return json({ messages: messagesData.data });
};

export const action = async ({ request }) => {
  const formData = await request.formData();
  const conversationId = formData.get("conversationId");
  const reply = formData.get("reply");

  const pageAccessToken = "YOUR_STORED_PAGE_ACCESS_TOKEN";

  const res = await fetch(`https://graph.facebook.com/v18.0/${conversationId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: reply,
      access_token: pageAccessToken,
    }),
  });

  const data = await res.json();
  console.log("Reply sent:", data);

  return redirect("/");
};

export default function Index() {
  const { messages } = useLoaderData();

  // 🔵 Facebook Connect button logic
  const facebookLoginUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${
    import.meta.env.VITE_FACEBOOK_APP_ID
  }&redirect_uri=${
    import.meta.env.VITE_FB_REDIRECT_URI
  }&scope=email,public_profile,pages_messaging,pages_show_list,pages_read_engagement,pages_manage_metadata&auth_type=reauthenticate`;

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

  return (
    <div style={{ padding: "20px" }}>
      <h1>Facebook Connect & Messaging</h1>

      <button
        onClick={openFacebookLogin}
        style={{
          padding: "10px 20px",
          backgroundColor: "#4267B2",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          marginBottom: "20px",
        }}
      >
        Connect with Facebook
      </button>

      <div>
        <h2>Messages</h2>
        {messages.length === 0 ? (
          <p>No messages found.</p>
        ) : (
          messages.map((conv) => (
            <div key={conv.id} style={{ border: "1px solid #ccc", marginBottom: "20px", padding: "10px" }}>
              <h3>Conversation ID: {conv.id}</h3>
              {conv.messages.data.map((msg) => (
                <p key={msg.id}>
                  <strong>{msg.from.name}:</strong> {msg.message}
                </p>
              ))}
              <Form method="post">
                <input type="hidden" name="conversationId" value={conv.id} />
                <input type="text" name="reply" placeholder="Type reply..." required />
                <button type="submit">Send</button>
              </Form>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
