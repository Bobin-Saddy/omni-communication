import { json } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();



export const action = async ({ request }) => {
  try {
    const formData = await request.json();
    console.log("Received formData:", formData);

    const { to, from, message, direction } = formData;

    if (!to || !from || !message || !direction) {
      return json({ error: "Missing fields" }, { status: 400 });
    }

const normalize = num => String(num).replace(/\D/g, "");

const savedMessage = await prisma.customerWhatsAppMessage.create({
  data: {
    to: normalize(to),
    from: normalize(from),
    message,
    direction,
    timestamp: new Date(),
  },
});


    console.log("Saved message---->:", savedMessage);
    return json(savedMessage, { status: 201 });
  } catch (error) {
    console.error("Error saving WhatsApp message:", error);
    return json({ error: "Server error" }, { status: 500 });
  }
};
