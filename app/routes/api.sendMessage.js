app.post("/api/sendMessage", async (req, res) => {
  const { conversationId, message } = req.body;

  if (!conversationId || !message) {
    return res.status(400).json({ error: "Missing conversationId or message" });
  }

  try {
    await prisma.chatMessage.create({
      data: {
        conversationId: parseInt(conversationId),
        sender: "me", // or "user"
        message,
      },
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save message" });
  }
});
