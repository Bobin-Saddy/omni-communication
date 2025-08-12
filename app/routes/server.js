import express from "express";
import { PrismaClient } from "@prisma/client";

const app = express();
app.use(express.json());

// 📌 WhatsApp webhook route here...

// 📌 Add the /get-messages route here
app.get("/get-messages", async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) {
      return res.status(400).json({ error: "Phone number is required" });
    }

    const session = await PrismaClient.chatSession.findUnique({
      where: { phone },
      select: { id: true }
    });

    if (!session) {
      return res.status(404).json({ error: "No chat session found for this phone number" });
    }

    const messages = await PrismaClient.chatMessage.findMany({
      where: { conversationId: session.id },
      orderBy: { createdAt: "asc" }
    });

    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));
