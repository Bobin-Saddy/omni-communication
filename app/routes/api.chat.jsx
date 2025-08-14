import { json } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function loader({ request }) {
  const url = new URL(request.url);
  const storeDomain = url.searchParams.get("store_domain");
  const sessionId = url.searchParams.get("session_id");
  const since = url.searchParams.get("since");

  if (!storeDomain || !sessionId) {
    return json({ ok: false, error: "Missing params" }, { status: 400 });
  }

  const where = { storeDomain, sessionId };
  if (since) {
    where.createdAt = { gt: new Date(since) };
  }

  const messages = await prisma.storeChatMessage.findMany({
    where,
    orderBy: { createdAt: "asc" },
  });

  return json({ ok: true, messages });
}

export async function action({ request }) {
  const body = await request.json();
  const { store_domain, session_id, message, sender } = body;

  if (!store_domain || !session_id || !message || !sender) {
    return json({ ok: false, error: "Missing fields" }, { status: 400 });
  }

  // Create session if not exists
  await prisma.storeChatSession.upsert({
    where: { sessionId: session_id },
    update: {},
    create: {
      storeDomain: store_domain,
      sessionId: session_id,
    },
  });

  // Save message
  await prisma.storeChatMessage.create({
    data: {
      storeDomain: store_domain,
      sessionId: session_id,
      sender,
      text: message,
    },
  });

  return json({ ok: true });
}
