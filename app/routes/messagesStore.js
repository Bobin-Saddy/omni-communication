// app/lib/messagesStore.js
import fs from "fs/promises";
import path from "path";

const filePath = path.resolve("data/messages.json");

// Read messages
export async function getMessages(number) {
  try {
    const data = await fs.readFile(filePath, "utf-8");
    const db = JSON.parse(data);
    return db[number] || [];
  } catch (err) {
    console.error("Error reading messages:", err);
    return [];
  }
}

// Save message
export async function saveMessage(number, message) {
  try {
    const data = await fs.readFile(filePath, "utf-8");
    const db = JSON.parse(data);

    if (!db[number]) db[number] = [];
    db[number].push(message);

    await fs.writeFile(filePath, JSON.stringify(db, null, 2));
  } catch (err) {
    console.error("Error saving message:", err);
  }
}
