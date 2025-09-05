import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";

const app = express();

// ----------- CORS -----------
app.use(
  cors({
    origin: "https://seo-partner.myshopify.com", // ✅ allow your Shopify store
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// ----------- File Upload Setup -----------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Save files in /uploads
  },
  filename: (req, file, cb) => {
    // unique filename
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// ✅ Serve /uploads folder as static so files can be accessed
app.use("/uploads", express.static("uploads"));

// ----------- Routes -----------
app.post("/api/chat", upload.single("file"), (req, res) => {
  const fileUrl = req.file
    ? `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`
    : null;

  res.json({
    message: "Chat received!",
    fileUrl,
  });
});

// ----------- Server Start -----------
app.listen(3000, () => console.log("🚀 Server running on port 3000"));
