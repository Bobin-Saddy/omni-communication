import fs from "fs";
import path from "path";
import { json } from "@remix-run/node";

export async function loader({ params }) {
  const { filename } = params;
  const filePath = path.join(process.cwd(), "uploads", filename);

  if (!fs.existsSync(filePath)) {
    throw new Response("Not Found", { status: 404 });
  }

  const fileStream = fs.createReadStream(filePath);
  return new Response(fileStream, {
    headers: { "Content-Type": "image/png" }, // adjust dynamically if needed
  });
}
