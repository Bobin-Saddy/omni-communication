// app/lib/messagesStore.js

export async function getMessages(number) {
  if (!number) {
    throw new Error("Phone number is required to fetch messages.");
  }

  try {
    const response = await fetch(`/api/messages?number=${encodeURIComponent(number)}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch messages: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error in getMessages:", error);
    return [];
  }
}
