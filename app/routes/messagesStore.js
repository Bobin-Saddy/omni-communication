// app/routes/messagesStore.js

const messagesDB = {
  "919779728764": [
    { sender: "Customer", text: "Hello, I need help with my order." },
    { sender: "Support", text: "Sure, can you give me your order ID?" },
    { sender: "Customer", text: "Yes, it's #12345." },
  ],
  "9876543210": [
    { sender: "Customer", text: "Is my parcel shipped?" },
    { sender: "Support", text: "Yes, shipped yesterday. Expected by Friday." },
  ],
};

export function getMessages(number) {
  return messagesDB[number] || [];
}
