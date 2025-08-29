// sendMessage.js (Remix action ya API route)
import { json } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const action = async ({ request }) => {
  try {
    const { to, from, message } = await request.json();

    // Step 1: Save to DB
    const savedMessage = await prisma.customerWhatsAppMessage.create({
      data: {
        to,
        from,
        message,
        direction: "outgoing",
        timestamp: new Date(),
      },
    });

    // Step 2: Send to WhatsApp API
    const resp = await fetch(
      `https://graph.facebook.com/v20.0/${from}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: { body: message },
        }),
      }
    );

    const apiResp = await resp.json();
    console.log("WhatsApp API resp:", apiResp);

    return json({ savedMessage, apiResp });
  } catch (error) {
    console.error("Error sending message:", error);
    return json({ error: "Failed to send" }, { status: 500 });
  }
};
