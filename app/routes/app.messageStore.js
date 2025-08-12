// app/messageStore.js
import axios from "axios";

const WHATSAPP_PHONE_NUMBER_ID = "106660072463312";
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN; // apna permanent token yahan rakho

// Messages ko memory me store karne ke liye
let messages = [];

/**
 * Naya message store kare
 */
export function storeMessage(message) {
  messages.push(message);
}

/**
 * Messages fetch kare sirf given phone number ID ke liye
 */
export async function fetchMessages() {
  try {
    // Conversations list laana
    const response = await axios.get(
      `https://graph.facebook.com/v20.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        },
      }
    );

    // Response me se filter lagana
    const filteredMessages = response.data.data.filter((msg) => {
      return (
        msg.metadata &&
        msg.metadata.phone_number_id === WHATSAPP_PHONE_NUMBER_ID
      );
    });

    messages = filteredMessages;
    return messages;
  } catch (error) {
    console.error("Error fetching messages:", error.response?.data || error);
    return [];
  }
}

/**
 * Memory me stored messages return kare
 */
export function getMessages() {
  return messages;
}
