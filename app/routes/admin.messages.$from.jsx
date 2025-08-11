import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import db from "../db.server";


export async function loader({ params }) {
  const from = decodeURIComponent(params.from);

  const messages = await db.whatsAppMessage.findMany({
    where: { from },
    orderBy: { timestamp: "asc" }
  });

  return json({ from, messages });
}

export default function ChatPage() {
  const { from, messages } = useLoaderData();

  return (
    <div style={{ padding: "1rem", display: "flex", flexDirection: "column", height: "90vh" }}>
      <h2>Chat with {from}</h2>

      <div
        style={{
          flexGrow: 1,
          border: "1px solid #ddd",
          borderRadius: "8px",
          padding: "1rem",
          background: "#f5f5f5",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {messages.map((msg, i) => {
          const isCustomer = msg.from === from;
          const prevMsg = i > 0 ? messages[i - 1] : null;
          const prevDate = prevMsg ? new Date(prevMsg.timestamp).toDateString() : null;
          const currDate = new Date(msg.timestamp).toDateString();

          return (
            <div key={msg.id} style={{ marginBottom: "1rem" }}>
              {/* Date separator */}
              {prevDate !== currDate && (
                <div style={{ textAlign: "center", margin: "0.5rem 0", fontSize: "0.8rem", color: "#777" }}>
                  {currDate}
                </div>
              )}

              {/* Chat bubble */}
              <div
                style={{
                  alignSelf: isCustomer ? "flex-start" : "flex-end",
                  background: isCustomer ? "#fff" : "#d1f1ff",
                  borderRadius: "16px",
                  padding: "0.6rem 1rem",
                  maxWidth: "70%",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                }}
              >
                <div style={{ fontSize: "0.95rem" }}>{msg.text}</div>
                <div style={{ fontSize: "0.7rem", textAlign: "right", marginTop: "0.3rem", color: "#777" }}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
