// routes/whatsapp-messages.jsx
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function loader({ request }) {
  const url = new URL(request.url);
  const number = url.searchParams.get("number");

  if (!number) {
    return new Response(JSON.stringify([]), { status: 200 });
  }

  const messages = await prisma.customerWhatsAppMessage.findMany({
    where: {
      OR: [{ from: number }, { to: number }],
    },
    orderBy: { timestamp: "asc" },
  });

  return new Response(JSON.stringify(messages), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
