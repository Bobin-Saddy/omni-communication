// lib/messagesStore.js
const messagesByNumber = {};

export function saveMessage(number, messageData) {
  if (!messagesByNumber[number]) {
    messagesByNumber[number] = [];
  }
  messagesByNumber[number].push(messageData);
}

export function getMessages(number) {
  return messagesByNumber[number] || [];
}
