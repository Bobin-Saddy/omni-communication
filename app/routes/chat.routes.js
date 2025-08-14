import express from "express";
import prisma from "./prisma.server.js";

const router = express.Router();

// Basic CORS for store frontends
router.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// Ensure session presence
async function ensureSession(storeDomain, sessionId) {
  if (!sessionId || !storeDomain) return;
  try {
    await prisma.chatSession.upsert({
      where: { sessionId },
      update: { storeDomain },
      create: { sessionId, storeDomain },
    });
  } catch (e) {
    console.error("ensureSession", e);
  }
}

// POST message (customer or owner)
router.post("/", async (req, res) => {
  try {
    const { store_domain, session_id, message, sender } = req.body || {};
    if (!store_domain || !message) {
      return res.status(400).json({ error: "store_domain and message required" });
    }
    // default sender = customer; session required for customers
    const finalSender = sender === "owner" ? "owner" : "customer";
    const finalSession = finalSender === "customer" ? (session_id || "") : (session_id || "admin");

    await ensureSession(store_domain, finalSession);

    const saved = await prisma.StoreChatMessage.create({
      data: {
        storeDomain: store_domain,
        sessionId: finalSession,
        sender: finalSender,
        text: message,
      },
    });
    res.json({ ok: true, message: saved });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "server_error" });
  }
});

// GET messages by session (for storefront widget)
router.get("/", async (req, res) => {
  try {
    const { store_domain, session_id, since } = req.query;
    if (!store_domain || !session_id) {
      return res.status(400).json({ error: "store_domain and session_id required" });
    }
    await ensureSession(store_domain, session_id);

    const sinceDate = since ? new Date(since) : null;

    const messages = await prisma.StoreChatMessage.findMany({
      where: {
        storeDomain: store_domain,
        sessionId: session_id,
        ...(sinceDate ? { createdAt: { gt: sinceDate } } : {}),
      },
      orderBy: { createdAt: "asc" },
      take: 200,
    });
    res.json({ ok: true, messages });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "server_error" });
  }
});

// Admin: list sessions (latest first)
router.get("/sessions", async (req, res) => {
  try {
    const { store_domain } = req.query;
    const sessions = await prisma.StoreChatSession.findMany({
      where: store_domain ? { storeDomain: store_domain } : {},
      orderBy: { lastSeenAt: "desc" },
      take: 200,
    });
    res.json({ ok: true, sessions });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "server_error" });
  }
});

// Admin: get messages for a session
router.get("/by-session", async (req, res) => {
  try {
    const { store_domain, session_id } = req.query;
    if (!store_domain || !session_id) {
      return res.status(400).json({ error: "store_domain and session_id required" });
    }
    const messages = await prisma.StoreChatMessage.findMany({
      where: { storeDomain: store_domain, sessionId: session_id },
      orderBy: { createdAt: "asc" },
      take: 500,
    });
    res.json({ ok: true, messages });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "server_error" });
  }
});

export default router;
