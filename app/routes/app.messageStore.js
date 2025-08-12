// app/routes/app.messageStore.js

// In-memory message store object
export const messageStore = {};

// Optional: helper functions agar future me use karna ho
export function getMessages(userId) {
  return messageStore[userId] || [];
}

export function clearMessages(userId) {
  if (messageStore[userId]) {
    delete messageStore[userId];
  }
}
