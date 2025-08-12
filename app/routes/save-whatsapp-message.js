import { json } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const action = async ({ request }) => {
  try {
    const formData = await request.json();
    const { to, message, direction } = formData;

    if (!to || !message || !direction) {
      return json({ error: "Missing fields" }, { status: 400 });
    }

    const savedMessage = await prisma.customerWhatsAppMessage.create({
      data: {
        to,
        message,
        direction,
      },
    });

    return json(savedMessage, { status: 201 });
  } catch (error) {
    console.error("Error saving WhatsApp message:", error);
    return json({ error: "Server error" }, { status: 500 });
  }
};

export default function SaveWhatsAppMessage() {
  return <div>Save WhatsApp Message Route</div>;
}
