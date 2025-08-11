import fetch from "node-fetch";

export default async function sendWhatsapp(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { to, text } = req.body;

  try {
    const response = await fetch(
      `https://graph.facebook.com/v17.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
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

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    console.error("Error sending WhatsApp message:", err);
    return res.status(500).json({ error: "Failed to send message" });
  }
}
