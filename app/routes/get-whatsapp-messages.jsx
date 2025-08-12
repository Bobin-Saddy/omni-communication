import { json } from "@remix-run/node";
import prisma from "../db.server";

export async function loader({ request }) {
  const url = new URL(request.url);
  const phoneNumber = url.searchParams.get("number");
  if (!phoneNumber) {
    return json({ error: "Phone number is required" }, { status: 400 });
  }

  // Fetch messages where either 'to' or 'from' matches the number
  const messages = await prisma.customerWhatsAppMessage.findMany({
    where: {
      OR: [{ to: phoneNumber }, { from: phoneNumber }],
    },
    orderBy: { timestamp: "asc" },
  });

  return json({ messages });
}
