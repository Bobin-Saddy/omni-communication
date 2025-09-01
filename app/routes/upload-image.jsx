// app/routes/upload-image.jsx
import { json, unstable_parseMultipartFormData, writeAsyncIterableToWritable } from "@remix-run/node";
import fs from "fs";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

// Ensure upload directory exists
function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

// Custom upload handler (saves file to disk)
async function fileUploadHandler({ name, filename, contentType, data }) {
  if (name !== "file") return undefined;

  ensureUploadDir();

  const safeName = filename.replace(/\s+/g, "_"); // replace spaces
  const filePath = path.join(UPLOAD_DIR, safeName);

  const writable = fs.createWriteStream(filePath);
  await writeAsyncIterableToWritable(data, writable);

  return safeName;
}

export async function action({ request }) {
  const formData = await unstable_parseMultipartFormData(request, fileUploadHandler);
  const uploadedFile = formData.get("file");

  if (!uploadedFile) {
    return json({ success: false, error: "No file uploaded" }, { status: 400 });
  }

  // Public URL to serve uploaded file
  const url = `/uploads/${uploadedFile}`;
  return json({ success: true, url });
}
