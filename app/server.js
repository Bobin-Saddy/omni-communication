import express from "express";
import cors from "cors";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

const app = express();

// Multer for temporary file storage
const upload = multer({ dest: "tmp/" });

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload API
app.post("/routes/api.chat", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "chat_uploads",
    });

    // cleanup temp file
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

app.use(cors());
app.listen(3000, () => console.log("🚀 Server running on port 3000"));
