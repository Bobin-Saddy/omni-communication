// app/routes/send-message.jsx
import { json } from "@remix-run/node";

export async function action({ request }) {
  const formData = await request.formData();
  const message = formData.get("message");

  const WHATSAPP_TOKEN =
    "EAAHvZAZB8ZCmugBPMA9abhl8iAbQJZCZCG2bUh6TOanHlaBsXDkZArjU6VkZC3P0ZAUwKJ7DJLK3trzuuvcYUwGJg7MmtRcd7fHCAYig66x93MUIhrqfOAgzQpHEMAwZCqoYiwYVzd46SY3Gr4C79HrQzdkb9BbxU8uKEQN2YnROmlzNPfeagLy0DAdwgZBD9ZB7aLoygT88QaNtZCfc3ttEAo3sj99vGYCZBTGqRAJEMIYP5IwZDZD";
  const PHONE_NUMBER_ID = "106660072463312";
  const RECIPIENT_NUMBER = "919779728764";

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

    return json({ success: response.ok, data });
  } catch (error) {
    return json({ success: false, error: error.message });
  }
}
