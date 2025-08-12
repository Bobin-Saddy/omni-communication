import { json } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const action = async ({ request }) => {
  try {
    const formData = await request.json();
    const { to, from, message, direction } = formData;

    if (!to || !from || !message || !direction) {
      return json({ error: "Missing fields" }, { status: 400 });
    }

    const savedMessage = await prisma.customerWhatsAppMessage.create({
      data: {
        to,
        from,       // <-- Yahan add kiya
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


// React component hata dein ya comment kar dein agar ye sirf API route hai
// export default function SaveWhatsAppMessage() {
//   return <div>Save WhatsApp Message Route</div>;
// }
