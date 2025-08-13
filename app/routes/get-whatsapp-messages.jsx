import { json } from "@remix-run/node";
import prisma from "../db.server";

export async function loader({ request }) {
  const url = new URL(request.url);
const normalize = num => String(num).replace(/\D/g, "");
const phoneNumber = normalize(url.searchParams.get("number"));

const messages = await prisma.customerWhatsAppMessage.findMany({
  where: {
    OR: [
      { to: phoneNumber },
      { from: phoneNumber }
    ]
  },
  orderBy: { timestamp: "asc" }
});


  return json({ messages });
}
