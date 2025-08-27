// app/routes/api/whatsapp-users.jsx
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function loader() {
  // Return unique WhatsApp numbers who sent messages
  const users = await prisma.customerWhatsAppMessage.findMany({
    select: { from: true, to: true },
    distinct: ["from"],
  });

  const formattedUsers = users.map(u => ({
    number: u.from,
    name: u.from, // you can join with user table if you have names
  }));

  return new Response(JSON.stringify(formattedUsers), { status: 200 });
}
