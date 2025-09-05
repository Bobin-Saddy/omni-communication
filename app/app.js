// app.js
import express from "express";
import multer from "multer";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const app = express();

// ---------- Upload setup ----------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), "uploads"));
  },
  filename: (req, file, cb) => {
    const safeName = Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, safeName);
  },
});
const upload = multer({ storage });

// ---------- Middleware ----------
app.use(express.json());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// ---------- Chat message save ----------
app.post("/api/chat", upload.single("file"), async (req, res) => {
  try {
    const { sessionId, storeDomain, sender = "customer", message, name } =
      req.body;

    if (!sessionId || !storeDomain) {
      return res.status(400).json({ ok: false, error: "Missing fields" });
    }

    let fileUrl = null;
    let fileName = null;
    if (req.file) {
      fileName = req.file.originalname;
      fileUrl = `/uploads/${req.file.filename}`;
    }

    // Save chat session
    await prisma.storeChatSession.upsert({
      where: { storeDomain_sessionId: { storeDomain, sessionId } },
      update: {},
      create: { sessionId, storeDomain },
    });

    // Save message
    const savedMessage = await prisma.storeChatMessage.create({
      data: {
        sessionId,
        storeDomain,
        sender,
        name: name || `User-${sessionId}`,
        text: message || null,
        fileUrl,
        fileName,
      },
    });

    res.json({ ok: true, message: savedMessage });
  } catch (err) {
    console.error("Error in /api/chat:", err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

// ---------- Start server ----------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
