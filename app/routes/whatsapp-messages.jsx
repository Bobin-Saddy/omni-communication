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

  const normalized = messages.map((m) => ({
    id: m.id,
    text: m.message,
    createdAt: m.timestamp,
    sender: m.direction === "outgoing" ? "me" : "them",
    waMessageId: m.waMessageId || null,
  }));

  return new Response(JSON.stringify(normalized), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function action({ request }) {
  try {
    const data = await request.json();
    const { number, text, sender, direction, createdAt, waMessageId, localId } = data;

    if (!number || !text) {
      return new Response(
        JSON.stringify({ ok: false, error: "Missing number or text" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const message = await prisma.customerWhatsAppMessage.create({
      data: {
        from: sender === "me" ? "me" : number,
        to: sender === "me" ? number : "me",
        message: text,
        timestamp: createdAt ? new Date(createdAt) : new Date(),
        direction: direction || (sender === "me" ? "outgoing" : "incoming"),
        waMessageId: waMessageId || undefined, // optional — requires schema column
      },
    });

    return new Response(
      JSON.stringify({
        ok: true,
        message: {
          id: message.id,
          text: message.message,
          createdAt: message.timestamp,
          sender: message.direction === "outgoing" ? "me" : "them",
          waMessageId: message.waMessageId || null,
          localId: localId || null,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error saving outgoing WhatsApp message:", err);
    return new Response(
      JSON.stringify({ ok: false, error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
