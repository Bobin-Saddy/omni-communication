// pages/api/get-whatsapp-messages.js
export default async function handler(req, res) {
  const number = req.query.number;

  // This is mocked. Replace with actual DB or in-memory storage.
  const mockMessages = [
    {
      id: "1",
      from: { id: "user" },
      displayName: "John Doe",
      message: "Hello!",
      created_time: new Date().toISOString(),
    },
  ];

  res.status(200).json({ messages: mockMessages });
}
