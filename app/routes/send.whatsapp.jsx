// send.whatsapp.jsx
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function action({ request }) {
  const { to, text } = await request.json();

  // Call WhatsApp Graph API
  const res = await fetch(
    `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages?access_token=${process.env.WHATSAPP_TOKEN}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        text: { body: text },
      }),
    }
  );

  const result = await res.json();

  if (res.ok) {
    // Save OUTGOING message
    await prisma.customerWhatsAppMessage.create({
      data: {
        to,
        from: process.env.BUSINESS_NUMBER,
        message: text,
        direction: "outgoing",
        timestamp: new Date(),
      },
    });

    return new Response(JSON.stringify({ success: true, result }), {
      status: 200,
    });
  }

  return new Response(JSON.stringify({ success: false, result }), {
    status: 500,
  });
}
