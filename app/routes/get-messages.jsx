import { json } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function loader({ request }) {
  const url = new URL(request.url);
  const phoneNumber = url.searchParams.get("number");

  if (!phoneNumber) {
    return json({ error: "Phone number is required" }, { status: 400 });
  }

  try {
    // Fetch messages where the phone number is either the sender or the recipient
    const messages = await prisma.customerWhatsAppMessage.findMany({
      where: {
        OR: [
          { to: phoneNumber },
          { from: phoneNumber },
        ],
      },
      orderBy: { timestamp: "asc" }, // or createdAt if you use that field
    });

    return json({ messages });
  } catch (error) {
    console.error("Error fetching WhatsApp messages:", error);
    return json({ error: "Server error" }, { status: 500 });
  }
}
