import fs from "fs";
import path from "path";
import { json } from "@remix-run/node";

// This loader serves uploaded files from /uploads
export async function loader({ params }) {
  const { filename } = params;

  // Ensure filename is safe (avoid path traversal)
  if (!filename || filename.includes("..") || filename.includes("/")) {
    return new Response("Invalid filename", { status: 400 });
  }

  const uploadsDir = path.join(process.cwd(), "uploads");
  const filePath = path.join(uploadsDir, filename);

  if (!fs.existsSync(filePath)) {
    return new Response("Not Found", { status: 404 });
  }

  // Determine MIME type dynamically
  const ext = path.extname(filename).toLowerCase();
  let contentType = "application/octet-stream";
  if ([".png", ".jpg", ".jpeg", ".gif", ".webp"].includes(ext)) {
    contentType = `image/${ext === ".jpg" ? "jpeg" : ext.slice(1)}`;
  } else if (ext === ".pdf") {
    contentType = "application/pdf";
  } else if ([".doc", ".docx"].includes(ext)) {
    contentType = "application/msword";
  } else if (ext === ".txt") {
    contentType = "text/plain";
  }

  const fileStream = fs.createReadStream(filePath);
  return new Response(fileStream, {
    headers: { "Content-Type": contentType },
  });
}
