import express from "express";
import cors from "cors";

const app = express();

app.use(express.json());

// ✅ allow all OPTIONS preflight requests
app.use(cors({
  origin: "https://seo-partner.myshopify.com",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // include OPTIONS
  credentials: true
}));

// ✅ explicitly handle OPTIONS for all routes
app.options("*", cors());

// Example chat endpoint
app.post("/api/chat", (req, res) => {
  res.json({ message: "Chat received!" });
});

app.get("/api/chat", (req, res) => {
  res.json({ ok: true, messages: [] });
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server running");
});
