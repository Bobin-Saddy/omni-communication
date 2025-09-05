import { json } from "@remix-run/node";
import cloudinary from "./cloudinary";
import fs from "fs";

export async function action({ request }) {
  const formData = await request.formData();
  const file = formData.get("file");

  let fileUrl = null;

  if (file && file.size > 0) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const tempPath = `/tmp/${Date.now()}-${file.name}`;
    fs.writeFileSync(tempPath, buffer);

    const result = await cloudinary.uploader.upload(tempPath, {
      folder: "chat_uploads",
      resource_type: "auto", // <-- allow pdf, doc, etc.
    });

    fileUrl = result.secure_url; // ✅ public https:// link
    fs.unlinkSync(tempPath);
  }

  return json({
    ok: true,
    message: {
      text: formData.get("text") || "",
      fileUrl,
      fileName: file?.name || null,
      sender: formData.get("sender") || "customer",
      createdAt: new Date().toISOString(),
    },
  });
}
