import { json } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const loader = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const number = url.searchParams.get("number");
    if (!number) {
      return json({ error: "Number parameter is required" }, { status: 400 });
    }

    // Fetch all messages where either to or from is this number
    const messages = await prisma.customerWhatsAppMessage.findMany({
      where: {
        OR: [{ to: number }, { from: number }],
      },
      orderBy: {
        timestamp: "asc", // or 'createdAt' if you use that field
      },
    });

    return json({ messages });
  } catch (error) {
    console.error("Error fetching WhatsApp messages:", error);
    return json({ error: "Server error" }, { status: 500 });
  }
};
