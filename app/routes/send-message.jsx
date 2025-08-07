// app/routes/api/send-message.jsx
export async function action({ request }) {
  const formData = await request.formData();
  const message = formData.get("message");

  const WHATSAPP_TOKEN =
    "EAAHvZAZB8ZCmugBPB3TqZBwiaZC5UqJ6eTqvILhvX7BUXVkbJYGZB4aqmzs8wZAhbfQO0u1Qk6EVtkwXfnujJiWS05tdZCLB2lfZBi4Pu7ICOFLJIs3ESSCG4V0Kx7KanTZBpSAZAjZByuNUrottyKQU47fJ0W8qeZCj2ZCKYsNFck3RGXNUZB93JcEokd9eXpTTQks5eBJ312w8kZAdLuyqFyO5ZCZATFj5mW97skbJXA0ZB1MG6v1BQZDZD";
  const PHONE_NUMBER_ID = "106660072463312";
  const RECIPIENT_NUMBER = "919779728764"; // Must be in international format

  const url = `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    to: RECIPIENT_NUMBER,
    type: "text",
    text: {
      body: message,
    },
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("WhatsApp error:", data);
      return new Response("Failed to send message", { status: 500 });
    }

    return new Response("Message sent!", { status: 200 });
  } catch (error) {
    console.error("Fetch error:", error);
    return new Response("Something went wrong", { status: 500 });
  }
}
