import express from "express";
import cors from "cors";

const app = express();

app.use(cors({
  origin: "https://seo-partner.myshopify.com",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.post("/api/chat", (req, res) => {
  res.json({ message: "Chat received!" });
});

app.listen(3000, () => console.log("Server running"));
