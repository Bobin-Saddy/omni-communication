// app/routes/api/send-message.jsx
export async function action({ request }) {
  const formData = await request.formData();
  const message = formData.get("message");

  const WHATSAPP_TOKEN =
    "EAAHvZAZB8ZCmugBPMA9abhl8iAbQJZCZCG2bUh6TOanHlaBsXDkZArjU6VkZC3P0ZAUwKJ7DJLK3trzuuvcYUwGJg7MmtRcd7fHCAYig66x93MUIhrqfOAgzQpHEMAwZCqoYiwYVzd46SY3Gr4C79HrQzdkb9BbxU8uKEQN2YnROmlzNPfeagLy0DAdwgZBD9ZB7aLoygT88QaNtZCfc3ttEAo3sj99vGYCZBTGqRAJEMIYP5IwZDZD";
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
