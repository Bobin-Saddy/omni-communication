// routes/whatsapp-messages.jsx
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// ----------------- FETCH MESSAGES -----------------
// ----------------- FETCH MESSAGES -----------------
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

  // ✅ Always set sender based on direction
  const normalized = messages.map((m) => ({
    id: m.id,
    text: m.message,
    createdAt: m.timestamp,
    sender: m.direction === "outgoing" ? "me" : "them", // << blue for outgoing
  }));

  return new Response(JSON.stringify(normalized), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}


// ----------------- HANDLE OUTGOING MESSAGES -----------------
// ----------------- HANDLE OUTGOING / SAVE MESSAGES -----------------
export async function action({ request }) {
  try {
    const data = await request.json();
    const {
      number,
      text,
      direction = "incoming", // default fallback
      platformMessageId,
      localId,
      createdAt,
    } = data;

    if (!number || !text) {
      return new Response(
        JSON.stringify({ ok: false, error: "Missing number or text" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 🔹 Dedupe by platformMessageId
    if (platformMessageId) {
      const existing = await prisma.customerWhatsAppMessage.findUnique({
        where: { platformMessageId },
      });
      if (existing) {
        return new Response(
          JSON.stringify({
            ok: true,
            message: {
              id: existing.id,
              text: existing.message,
              createdAt: existing.timestamp,
              sender: existing.direction === "outgoing" ? "me" : "them",
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // 🔹 Optionally dedupe by localId
    if (localId) {
      const existingLocal = await prisma.customerWhatsAppMessage.findFirst({
        where: { localId },
      });
      if (existingLocal) {
        return new Response(
          JSON.stringify({
            ok: true,
            message: {
              id: existingLocal.id,
              text: existingLocal.message,
              createdAt: existingLocal.timestamp,
              sender: existingLocal.direction === "outgoing" ? "me" : "them",
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // 🔹 Save message (trust explicit direction instead of inferring)
  const message = await prisma.customerWhatsAppMessage.create({
  data: {
    from: sender === "me" ? "me" : number,
    to: sender === "me" ? number : "me",
    message: text,
    timestamp: new Date(),
    direction: sender === "me" ? "outgoing" : "incoming",
  },
});

// ✅ return sender = "me" if outgoing
return new Response(
  JSON.stringify({
    ok: true,
    message: {
      id: message.id,
      text: message.message,
      createdAt: message.timestamp,
      sender: message.direction === "outgoing" ? "me" : "them",
    },
  }),
  { status: 200, headers: { "Content-Type": "application/json" } }
);

  } catch (err) {
    console.error("Error saving WhatsApp message:", err);
    return new Response(
      JSON.stringify({ ok: false, error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

