import { PrismaClient } from "@prisma/client";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, message, direction } = req.body;

  if (!to || !message || !direction) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const saved = await PrismaClient.customerWhatsAppMessage.create({
      data: { to, message, direction },
    });
    return res.status(201).json(saved);
  } catch (error) {
    console.error("DB save error:", error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
