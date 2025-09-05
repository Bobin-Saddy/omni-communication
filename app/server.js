// server.js
import express from "express";
import cors from "cors";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";

const app = express();

// -------------------- CORS --------------------
app.use(
  cors({
    origin: "https://seo-partner.myshopify.com", // your store
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// -------------------- Multer Config --------------------
const upload = multer({ dest: "uploads/" }); // temporary storage

// -------------------- Cloudinary Config --------------------
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// -------------------- Routes --------------------

// Upload file + chat
app.post("/api/chat", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "chat_uploads",
    });

    res.json({
      message: "Chat received!",
      fileUrl: result.secure_url,
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

// -------------------- Start Server --------------------
app.listen(3000, () => console.log("✅ Server running on port 3000"));
