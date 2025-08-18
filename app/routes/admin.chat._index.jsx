import { useLoaderData } from "@remix-run/react";
import { useEffect, useState } from "react";

export default function ChatList() {
  const { sessions: initialSessions } = useLoaderData();
  const [sessions, setSessions] = useState(initialSessions);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const url = new URL(window.location.href);
        const shop = url.searchParams.get("shop");
        if (!shop) return;
        const res = await fetch(`/admin/chat/list?shop=${shop}`);
        const data = await res.json();
        setSessions(data.sessions);
      } catch (err) {
        console.error("Polling error", err);
      }
    }, 5000); // poll every 5 sec
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h1>Chat Sessions for this Store</h1>
      {sessions.length === 0 ? (
        <p>No active sessions</p>
      ) : (
        <ul>
          {sessions.map((s) => (
            <li key={s.id}>
              <Link to={`/admin/chat/${s.sessionId}`}>
                👤 {s.sessionId} <br />
                🏬 {s.storeDomain}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
