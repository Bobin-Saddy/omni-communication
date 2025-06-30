// app/routes/send-reply.$conversationId.jsx

import { json, redirect } from "@remix-run/node";

export const action = async ({ request, params }) => {
  const conversationId = params.conversationId;
  const formData = await request.formData();
  const reply = formData.get("reply");

  const pageAccessToken = "YOUR_STORED_PAGE_ACCESS_TOKEN";

  // Send message to conversation
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

export default function SendReply() {
  return null;
}
