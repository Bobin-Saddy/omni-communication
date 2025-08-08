const messagesDB = { /* ... */ };

export function saveMessage(number, message) {
  if (!messagesDB[number]) {
    messagesDB[number] = [];
  }
  messagesDB[number].push(message);
}

export function getMessages(number) {
  return messagesDB[number] || [];
}
