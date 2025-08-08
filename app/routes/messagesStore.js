// lib/messagesStore.js (or .ts)
export async function getMessages(number) {
  const res = await fetch(`/app/messages?number=${encodeURIComponent(number)}`);
  if (!res.ok) throw new Error("Failed to fetch");
  return await res.json();
}
