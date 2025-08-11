// app/routes/get-messages.js
import express from "express";
import { storedMessages } from "./webhook.js";

const router = express.Router();

router.get("/get-messages", (req, res) => {
  res.json({ messages: storedMessages });
});

export default router;
