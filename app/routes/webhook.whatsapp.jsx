import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const VERIFY_TOKEN = "12345";

export async function loader({ request }) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }
  return new Response("Verification failed", { status: 403 });
}

export async function action({ request }) {
  const body = await request.json();
  const messages = body?.entry?.[0]?.changes?.[0]?.value?.messages;

  if (messages && messages.length > 0) {
    const msg = messages[0];
    const from = msg.from;
    const text = msg?.text?.body || "";
    const name = msg?.profile?.name || "";

    // Save to DB with upsert
    await prisma.chatSession.upsert({
      where: { phone: from },
      update: {
        messages: {
          create: {
            content: text,
            sender: "user",
          }
        }
      },
      create: {
        userId: from, // could also be some generated unique ID
        userName: name,
        phone: from,
        messages: {
          create: {
            content: text,
            sender: "user",
          }
        }
      }
    });

    console.log("Stored message from", from, text);
  }

  return new Response("EVENT_RECEIVED", { status: 200 });
}
