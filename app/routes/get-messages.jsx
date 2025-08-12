// app/routes/get-messages.jsx
import { json } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function loader({ request }) {
  const url = new URL(request.url);
  const number = url.searchParams.get("number");

  if (!number) {
    return json({ error: "Missing number" }, { status: 400 });
  }

  const session = await prisma.chatSession.findUnique({
    where: { phone: number },
    include: {
      messages: {
        orderBy: { createdAt: "asc" }
      }
    }
  });

  if (!session) {
    return json([]);
  }

  return json(session.messages);
}
