import { json } from "@remix-run/node";

export async function loader({ request }) {
  const url = new URL(request.url);
  const number = url.searchParams.get("number");

  if (!number) {
    return json({ error: "Missing 'number' query parameter" }, { status: 400 });
  }

  try {
    // Here you would call WhatsApp Cloud API or your DB to get messages for 'number'
    // Example (pseudo-code):

    /*
    const response = await fetch(`https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages?recipient=${number}`, {
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
      },
    });
    const data = await response.json();
    */

    // For now, returning dummy messages
    const messages = [
      {
        id: "1",
        from: { id: number },
        message: "Hello from WhatsApp user",
        created_time: new Date().toISOString(),
      },
      {
        id: "2",
        from: { id: "me" },
        message: "Hi! How can I help you?",
        created_time: new Date().toISOString(),
      },
    ];

    return json({ messages });
  } catch (error) {
    console.error("Failed to fetch WhatsApp messages:", error);
    return json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}
