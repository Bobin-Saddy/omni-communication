import { json } from "@remix-run/node";
import { messageStore } from "./app.messageStore";

export async function loader({ request }) {
  try {
    const url = new URL(request.url);
    const number = url.searchParams.get("number");
    if (!number) {
      return json({ error: "Missing 'number' query parameter" }, { status: 400 });
    }

    const messages = messageStore[number] || [];
    return json({ messages });
  } catch (error) {
    console.error("Error in get-messages loader:", error);
    return json({ error: "Internal Server Error" }, { status: 500 });
  }
}
