import express from "express";
import cors from "cors";
import multer from "multer";

const app = express();

// Middleware
app.use(cors({
  origin: "https://seo-partner.myshopify.com",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// File upload setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // make sure this folder exists
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});
const upload = multer({ storage });

// API route for text messages
app.post("/api/chat", (req, res) => {
  console.log("Chat message received:", req.body);
  res.json({ message: "Chat received!", data: req.body });
});

// API route for file uploads
app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  const fileUrl = `http://localhost:3000/uploads/${req.file.filename}`;
  res.json({ message: "File uploaded successfully", fileUrl });
});

// Serve uploaded files statically
app.use("/uploads", express.static("uploads"));

// Start server
app.listen(3000, () => console.log("Server running on http://localhost:3000"));
