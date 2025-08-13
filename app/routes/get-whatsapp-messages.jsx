import { json } from "@remix-run/node";
import prisma from "../db.server";

export async function loader({ request }) {
  const url = new URL(request.url);
  const phoneNumber = url.searchParams.get("number");
  if (!phoneNumber) {
    return json({ error: "Phone number is required" }, { status: 400 });
  }

  const messages = await prisma.customerWhatsAppMessage.findMany({
    where: {
      OR: [
        { to: phoneNumber }, // outgoing messages
        { from: phoneNumber } // incoming messages
      ]
    },
    orderBy: { timestamp: "asc" },
  });

  return json({ messages });
}
