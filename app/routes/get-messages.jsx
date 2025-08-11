// app/routes/api/get-messages.jsx
import { json } from "@remix-run/node";

let messagesStore = []; // Temporary storage — replace with DB

export async function loader() {
  return json({ messages: messagesStore });
}

// Export a function to store messages (used by webhook)
export function storeWhatsAppMessage(message) {
  messagesStore.push(message);
}
