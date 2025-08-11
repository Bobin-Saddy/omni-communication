import { json } from "@remix-run/node";

// Import messageStore from webhook file or move it to a common module
// For simplicity, let's declare it here as well (ideally use shared storage or DB)
const messageStore = {};  // Replace with your actual store reference or DB calls

export async function loader({ request }) {
  try {
    const url = new URL(request.url);
    const number = url.searchParams.get("number");
    if (!number) {
      return json({ error: "Missing 'number' query parameter" }, { status: 400 });
    }

    // Fetch messages from the in-memory store
    const messages = messageStore[number] || [];

    return json({ messages });
  } catch (error) {
    console.error("Error in get-messages loader:", error);
    return json({ error: "Internal Server Error" }, { status: 500 });
  }
}
