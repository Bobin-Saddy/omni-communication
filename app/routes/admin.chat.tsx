import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useEffect, useRef, useState } from "react";

export const loader: LoaderFunction = async () => {
  return json({});
};

export default function OmniChatAdmin() {
  const API = "https://omnichannel-communication-3d7329b35a37.herokuapp.com/api/chat";
  const STORE = ""; // Optional: set a store filter
  const [sessions, setSessions] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [currentSession, setCurrentSession] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const msgsRef = useRef<HTMLDivElement>(null);

  const bubbleClass = (sender: string) =>
    sender === "owner" ? "bubble me" : "bubble them";

  const loadSessions = async () => {
    const url = new URL(API + "/sessions");
    if (STORE) url.searchParams.set("store_domain", STORE);
    const r = await fetch(url.toString());
    const data = await r.json();
    setSessions(data.sessions || []);
  };

  const loadMessages = async (clear: boolean) => {
    if (!currentSession) return;
    const url = new URL(API + "/by-session");
    if (STORE) url.searchParams.set("store_domain", STORE);
    url.searchParams.set("session_id", currentSession);
    const r = await fetch(url.toString());
    const data = await r.json();
    setMessages(clear ? data.messages || [] : [...messages, ...(data.messages || [])]);
  };

  const sendMessage = async () => {
    if (!currentSession || !inputValue.trim()) return;
    const text = inputValue.trim();
    setMessages([...messages, { text, sender: "owner" }]);
    setInputValue("");
    await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        store_domain: STORE || (currentSession.split(":")[0] || ""),
        session_id: currentSession,
        message: text,
        sender: "owner"
      })
    });
  };

  useEffect(() => {
    loadSessions();
    const sessionsInterval = setInterval(loadSessions, 5000);
    const messagesInterval = setInterval(() => loadMessages(false), 3000);
    return () => {
      clearInterval(sessionsInterval);
      clearInterval(messagesInterval);
    };
  }, [currentSession]);

  useEffect(() => {
    if (msgsRef.current) {
      msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <html>
      <head>
        <title>Omni Chat Admin</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Arial; margin: 0; display:flex; height:100vh; }
          .left { width: 320px; border-right:1px solid #eee; padding:12px; overflow:auto; }
          .right { flex:1; display:flex; flex-direction:column; }
          .head { padding:12px; border-bottom:1px solid #eee; font-weight:700; }
          .msgs { flex:1; padding:12px; overflow:auto; background:#fafafa; }
          .input { display:flex; gap:8px; padding:12px; border-top:1px solid #eee; background:#fff; }
          .input input { flex:1; padding:10px; border:1px solid #ddd; border-radius:10px; }
          .input button { padding:10px 14px; border:none; border-radius:10px; background:#111827; color:#fff; font-weight:700; cursor:pointer; }
          .item { padding:8px; border-radius:8px; cursor:pointer; margin-bottom:6px; border:1px solid #eee; }
          .item.active { background:#eef2ff; border-color:#c7d2fe; }
          .bubble { max-width:70%; padding:8px 10px; border-radius:12px; margin:6px 0; font-size:14px; line-height:1.3; }
          .them { background:#e6f2ff; margin-right:auto; }
          .me { background:#f3f4f6; margin-left:auto; }
        `}</style>
      </head>
      <body>
        <div className="left">
          <h3>Sessions</h3>
          <div id="sessions">
            {sessions.map((s) => (
              <div
                key={s.sessionId}
                className={`item ${currentSession === s.sessionId ? "active" : ""}`}
                onClick={() => {
                  setCurrentSession(s.sessionId);
                  loadMessages(true);
                }}
              >
                {s.storeDomain} • {s.sessionId}
              </div>
            ))}
          </div>
        </div>
        <div className="right">
          <div className="head">Chat</div>
          <div id="msgs" ref={msgsRef} className="msgs">
            {messages.map((m, idx) => (
              <div key={idx} className={bubbleClass(m.sender)}>
                {m.text}
              </div>
            ))}
          </div>
          <div className="input">
            <input
              id="msg"
              placeholder="Type a reply…"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button id="send" onClick={sendMessage}>
              Send
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
