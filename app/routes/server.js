import express from "express";
import cors from "cors";

const app = express();

// enable CORS for your Shopify store
app.use(cors({
  origin: "https://seo-partner.myshopify.com",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json()); // parse JSON body

// API endpoint
app.post("/api/chat", (req, res) => {
  res.json({ message: "Chat received!" });
});

// start server
app.listen(3000, () => console.log("Server running on port 3000"));
