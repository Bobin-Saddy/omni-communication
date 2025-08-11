import { json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import db from "../db.server";


export async function loader() {
  const customers = await db.whatsAppMessage.findMany({
    select: { from: true },
    distinct: ["from"],
    orderBy: { from: "asc" }
  });
  return json(customers);
}

export default function MessagesPage() {
  const customers = useLoaderData();

  return (
    <div style={{ padding: "1rem" }}>
      <h1>WhatsApp Chats</h1>
      <ul>
        {customers.map(c => (
          <li key={c.from}>
            <Link to={`/admin/messages/${encodeURIComponent(c.from)}`}>
              Chat with {c.from}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
