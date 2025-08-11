import { json } from "@remix-run/node";

const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;

export async function loader({ request }) {
  const url = new URL(request.url);
  const number = url.searchParams.get("number");

  if (!number) {
    return json({ error: "Missing 'number' query parameter" }, { status: 400 });
  }

  if (!WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_TOKEN) {
    return json({ error: "WhatsApp credentials not configured" }, { status: 500 });
  }

  try {
    // NOTE: WhatsApp Cloud API does NOT have direct 'get messages' endpoint like this.
    // Usually, you receive messages via webhook and store in your DB.
    // For demo, I'm assuming you have an API or DB to get messages for the user number.

    // If you have your own DB:
    // const messages = await getMessagesFromDB(number);

    // For example, if you want to simulate fetching messages dynamically from your DB:
    // Replace this with your DB call

    const messages = await fetchMessagesFromDB(number); // implement this function

    return json({ messages });
  } catch (error) {
    console.error("Failed to fetch WhatsApp messages:", error);
    return json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

// Dummy DB fetch function for demonstration
async function fetchMessagesFromDB(number) {
  // Replace with real DB query filtering by number
  // For now, returning dummy data with dynamic timestamp

  return [
    {
      id: "1",
      from: { id: number },
      message: "Hello from WhatsApp user " + number,
      created_time: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    },
    {
      id: "2",
      from: { id: "me" },
      message: "Hi! How can I help you?",
      created_time: new Date().toISOString(),
    },
  ];
}
