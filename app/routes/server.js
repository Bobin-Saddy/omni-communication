// server.js (or app.server.js)
import express from "express";
import bodyParser from "body-parser";
import chatRoutes from "./chat.routes";

const app = express();
app.use(bodyParser.json());

app.use("/api/chat", chatRoutes);

app.get("/", (req, res) => res.send(`OK: ${process.env.APP_NAME || "omni-communication"}`));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server on ${port}`));
