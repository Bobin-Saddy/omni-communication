// app/routes/admin.chat.list.jsx
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { db } from "../db.server"; // adjust path if needed
import { useState, useEffect } from "react";

// ---------- Loader ----------
export async function loader({ request }) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (!shop) {
    return json({ sessions: [] });
  }

  // ✅ Fetch chat sessions and include messages
  const sessions = await db.chatSession.findMany({
    where: { shop },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return json({ sessions });
}

// ---------- Component ----------
export default function AdminChatList() {
  const { sessions } = useLoaderData();
  const [selectedSession, setSelectedSession] = useState(null);

  useEffect(() => {
    if (sessions.length > 0 && !selectedSession) {
      setSelectedSession(sessions[0]);
    }
  }, [sessions, selectedSession]);

  return (
    <div
      className="social-chat-dashboard"
      style={{ fontFamily: "Arial, sans-serif", maxWidth: 1200, margin: "auto" }}
    >
      <h1 style={{ textAlign: "center", margin: "20px 0" }}>
        📱 Social Chat Dashboard
      </h1>

      <div style={{ display: "flex", gap: 20 }}>
        {/* Sidebar with sessions */}
        <div
          style={{
            width: "30%",
            borderRight: "1px solid #ddd",
            paddingRight: 20,
          }}
        >
          <h2>Conversations</h2>
          {sessions.length === 0 ? (
            <p>No sessions found</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {sessions.map((session) => (
                <li
                  key={session.id}
                  onClick={() => setSelectedSession(session)}
                  style={{
                    padding: "10px",
                    marginBottom: "8px",
                    border: "1px solid #ccc",
                    borderRadius: 8,
                    cursor: "pointer",
                    backgroundColor:
                      selectedSession?.id === session.id ? "#f0f0f0" : "#fff",
                  }}
                >
                  <strong>Session #{session.id}</strong>
                  <br />
                  {session.messages.length} messages
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Messages of selected session */}
        <div style={{ flex: 1, paddingLeft: 20 }}>
          {selectedSession ? (
            <>
              <h2>Messages</h2>
              <div
                style={{
                  border: "1px solid #ddd",
                  borderRadius: 8,
                  padding: 10,
                  height: 400,
                  overflowY: "auto",
                  background: "#fafafa",
                }}
              >
                {selectedSession.messages.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      marginBottom: 10,
                      textAlign: msg.sender === "user" ? "left" : "right",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        padding: "8px 12px",
                        borderRadius: 12,
                        background:
                          msg.sender === "user" ? "#e0e0e0" : "#cce5ff",
                      }}
                    >
                      {msg.content}
                    </span>
                    <div style={{ fontSize: "0.75rem", color: "#666" }}>
                      {new Date(msg.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p>Select a session to view messages</p>
          )}
        </div>
      </div>
    </div>
  );
}
