// api.js
import express from "express";
import { unreadMessages } from "./webhook.js";
const router = express.Router();

router.get("/unread-counts", (req, res) => {
  res.json(unreadMessages);
});

router.post("/mark-read", (req, res) => {
  const { conversationId } = req.body;
  unreadMessages[conversationId] = 0;
  res.json({ success: true });
});

export default router;
