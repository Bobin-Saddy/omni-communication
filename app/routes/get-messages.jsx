import { json } from "@remix-run/node";

const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;

export async function loader({ request }) {
  try {
    const url = new URL(request.url);
    const number = url.searchParams.get("number");
    if (!number) {
      return json({ error: "Missing 'number' query parameter" }, { status: 400 });
    }

    // Simulate fetching messages
    const messages = [
      {
        id: "1",
        from: { id: number },
        message: "Hello from WhatsApp user " + number,
        created_time: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
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
    console.error("Error in get-messages loader:", error);
    return json({ error: "Internal Server Error" }, { status: 500 });
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
