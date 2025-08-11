// app/routes/api/send-whatsapp.jsx
import { json } from "@remix-run/node";

export async function action({ request }) {
  try {
    const { to, text } = await request.json();

    if (!to || !text) {
      return json({ error: "Missing 'to' or 'text' field" }, { status: 400 });
    }

    const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN; // put in .env
    const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

    const res = await fetch(
      `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: { body: text },
        }),
      }
    );

    const data = await res.json();
    return json(data);
  } catch (err) {
    console.error("Send WhatsApp error:", err);
    return json({ error: "Failed to send message" }, { status: 500 });
  }
}
