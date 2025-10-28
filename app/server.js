import express from "express";
import { createRequestHandler } from "@remix-run/express";
import { fileURLToPath } from "url";
import path from "path";
import multer from "multer";
import cors from "cors";
import fs from "fs";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

// ----------------------
// Express + Remix setup
// ----------------------
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors());
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ----------------------
// Cloudinary Upload Setup
// ----------------------
const upload = multer({ dest: "tmp/" });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.post("/routes/api.chat", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "chat_uploads",
    });

    fs.unlinkSync(req.file.path);

    res.json({
      ok: true,
      message: {
        fileUrl: result.secure_url,
        fileName: req.file.originalname,
      },
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

// ----------------------
// Remix request handler
// ----------------------
app.all(
  "*",
  createRequestHandler({
    build: await import("./build/server/index.js"),
  })
);

// ----------------------
// Start server
// ----------------------
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
