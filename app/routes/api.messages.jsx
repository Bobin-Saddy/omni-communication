// app/routes/api/messages.jsx
import { json } from "@remix-run/node";

const messagesDB = {
  "919779728764": [
    { sender: "User", text: "Hi there!" },
    { sender: "Support", text: "Hello! How can I help?" },
  ],
};

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const number = url.searchParams.get("number");

  const messages = messagesDB[number] || [];
  return json(messages);
};
