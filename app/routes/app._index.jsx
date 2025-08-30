import React, { useEffect, useContext, useRef, useState } from "react";
import { AppContext } from "./AppContext";

export default function SocialChatDashboard() {
  const {
    connectedPages,
    conversations,
    setConversations,
    activeConversation,
    setActiveConversation,
    messages,
    setMessages,
  } = useContext(AppContext);

  const [uploading, setUploading] = useState(false);

  const textInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const WHATSAPP_TOKEN =
    "EAAHvZAZB8ZCmugBPaZAmOU2odpctyXmrYpzjg4RKjXZAbTQApbqZCwVfZCDmeDDwbUZA4rmelFNbw3dYD4T7pnSrQZBlZAGmAcBKOc4w5cdh6ZAnPSMf3WrSlu8IuOmmzLZC8q0QaSsGUacZClZBfzq7QQjirYeqOYMBFM3QGIn532KF9YgyPg5xrhZAXOaZAtUgN9TL9mSy0ZBdmYq00nMSwAxmPaUYXGXCAU1PhgqfZBSoX91Y6qLaIZD";
  const WHATSAPP_PHONE_NUMBER_ID = "106660072463312";

  /** ----------------- LOAD CONVERSATIONS ----------------- **/
  useEffect(() => {
    if (!connectedPages.length) return;
    connectedPages.forEach((page) => fetchConversations(page));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectedPages]);

  /** ----------------- SSE for chatwidget (real-time) ----------------- **/
  useEffect(() => {
    if (activeConversation?.pageType === "chatwidget") {
      const es = new EventSource(
        `/api/chat/stream?sessionId=${activeConversation.id}&storeDomain=${encodeURIComponent(
          activeConversation.storeDomain || ""
        )}`
      );

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setMessages((prev) => ({
            ...prev,
            [activeConversation.id]: [
              ...(prev[activeConversation.id] || []),
              data,
            ],
          }));
        } catch (e) {
          console.warn("SSE parse error", e);
        }
      };

      es.onerror = (err) => {
        // optionally reconnect logic
        console.warn("SSE error", err);
      };

      return () => es.close();
    }
  }, [activeConversation, setMessages]);

  /** ----------------- FETCH CONVERSATIONS ----------------- **/
  const fetchConversations = async (page) => {
    try {
      // WhatsApp
      if (page.type === "whatsapp") {
        const res = await fetch("/whatsapp-users");
        const users = await res.json();
        const convs = (users || []).map((u) => ({
          id: u.number,
          pageId: page.id,
          pageName: page.name,
          pageType: "whatsapp",
          participants: { data: [{ name: u.name || u.number }] },
          userNumber: u.number,
        }));
        setConversations((prev) => [
          ...prev.filter((c) => c.pageId !== page.id),
          ...convs,
        ]);
        return;
      }

      // Instagram
      if (page.type === "instagram") {
        const res = await fetch(
          `https://graph.facebook.com/v18.0/${page.pageId}/conversations?platform=instagram&fields=id,participants,updated_time&access_token=${page.access_token}`
        );
        const data = await res.json();
        if (!Array.isArray(data?.data)) return;

        const conversationsWithNames = data.data.map((conv) => {
          const parts = conv.participants?.data || [];
          const other = parts.find(
            (p) => p.id !== page.igId && p.id !== page.pageId
          ) || {};
          const userName = other.name || other.username || "Instagram User";
          return {
            id: conv.id,
            pageId: page.id,
            pageName: page.name,
            pageType: "instagram",
            participants: { data: [{ id: other.id, name: userName }] },
            recipientId: other.id,
            updated_time: conv.updated_time,
          };
        });

        setConversations((prev) => [
          ...prev.filter((c) => c.pageId !== page.id),
          ...conversationsWithNames,
        ]);
        return;
      }

      // Facebook
      if (page.type === "facebook") {
        const url = `https://graph.facebook.com/v18.0/${page.id}/conversations?fields=participants&access_token=${page.access_token}`;
        const res = await fetch(url);
        const data = await res.json();
        if (Array.isArray(data?.data)) {
          const convs = data.data.map((c) => ({
            id: c.id,
            pageId: page.id,
            pageName: page.name,
            pageType: "facebook",
            participants: {
              data:
                c.participants?.data?.map((p) => ({
                  name: p.name || p.username || p.id,
                  id: p.id,
                })) || [],
            },
          }));
          setConversations((prev) => [
            ...prev.filter((c) => c.pageId !== page.id),
            ...convs,
          ]);
        }
        return;
      }

      // Chat Widget (fetch sessions)
      if (page.type === "chatwidget") {
        const res = await fetch(`/api/chat?widget=true`);
        const data = await res.json();

        if (Array.isArray(data?.sessions)) {
          const convs = data.sessions.map((s) => ({
            id: s.sessionId,
            pageId: page.id,
            pageName: page.name,
            pageType: "chatwidget",
            participants: { data: [{ name: s.userName || s.sessionId }] },
            sessionId: s.sessionId,
            storeDomain: s.storeDomain,
          }));

          setConversations((prev) => [
            ...prev.filter((c) => c.pageId !== page.id),
            ...convs,
          ]);

          // Auto-select first conversation and load messages
          if (convs.length > 0) {
            const firstConv = convs[0];
            setActiveConversation(firstConv);

            const msgRes = await fetch(
              `/api/chat?storeDomain=${encodeURIComponent(
                firstConv.storeDomain || "myshop.com"
              )}&sessionId=${encodeURIComponent(firstConv.id)}`
            );
            if (msgRes.ok) {
              const msgData = await msgRes.json();
              setMessages((prev) => ({
                ...prev,
                [firstConv.id]: Array.isArray(msgData?.messages)
                  ? msgData.messages
                  : [],
              }));
            }
          }
        }
        return;
      }
    } catch (err) {
      console.error("Error fetching conversations:", err);
    }
  };

  /** ----------------- SELECT CONVERSATION ----------------- **/
  const handleSelectConversation = async (conv) => {
    setActiveConversation(conv);

    const page = connectedPages.find((p) => p.id === conv.pageId);
    if (!page) return;

    try {
      if (page.type === "chatwidget") {
        const res = await fetch(
          `/api/chat?storeDomain=${encodeURIComponent(
            conv.storeDomain || "myshop.com"
          )}&sessionId=${encodeURIComponent(conv.id)}`
        );

        if (res.ok) {
          const data = await res.json();
          setMessages((prev) => ({
            ...prev,
            [conv.id]: Array.isArray(data?.messages) ? data.messages : [],
          }));
        }
      } else if (page.type === "instagram" || page.type === "facebook") {
        const res = await fetch(
          `https://graph.facebook.com/v18.0/${conv.id}/messages?fields=from,to,message,created_time&access_token=${page.access_token}`
        );

        if (res.ok) {
          const data = await res.json();
          setMessages((prev) => ({
            ...prev,
            [conv.id]: Array.isArray(data?.data) ? data.data : [],
          }));
        }
      } else if (page.type === "whatsapp") {
        const res = await fetch(`/whatsapp-messages?number=${conv.id}`);
        const data = await res.json();
        setMessages((prev) => ({ ...prev, [conv.id]: data }));
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  /** ----------------- SEND MESSAGE (supports file for chatwidget) ----------------- **/
  const sendMessage = async (text = "", file = null) => {
    if (!activeConversation) return;
    const page = connectedPages.find((p) => p.id === activeConversation.pageId);
    if (!page) return;

    try {
      // ---------- WhatsApp ----------
      if (page.type === "whatsapp") {
        await fetch(
          `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages?access_token=${WHATSAPP_TOKEN}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              to: activeConversation.userNumber,
              text: { body: text },
            }),
          }
        );

        await fetch("/save-whatsapp-messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: activeConversation.userNumber,
            from: WHATSAPP_PHONE_NUMBER_ID,
            message: text,
            direction: "outgoing",
          }),
        });

        setMessages((prev) => ({
          ...prev,
          [activeConversation.id]: [
            ...(prev[activeConversation.id] || []),
            {
              from: "You",
              message: text,
              timestamp: new Date().toISOString(),
            },
          ],
        }));
        return;
      }

      // ---------- Instagram ----------
      if (page.type === "instagram") {
        const recipientId =
          activeConversation.recipientId ||
          activeConversation.participants?.data?.find(
            (p) => p.id && p.id !== page.igId
          )?.id;
        if (!recipientId) return console.error("No IG recipient id");

        const res = await fetch(
          `https://graph.facebook.com/v18.0/${page.pageId}/messages?access_token=${page.access_token}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messaging_type: "RESPONSE",
              recipient: { id: recipientId },
              message: { text },
            }),
          }
        );
        const result = await res.json();
        if (res.ok && result.id) {
          setMessages((prev) => ({
            ...prev,
            [activeConversation.id]: [
              ...(prev[activeConversation.id] || []),
              {
                from: { name: "You" },
                message: text,
                created_time: new Date().toISOString(),
              },
            ],
          }));
        } else {
          console.error("Instagram send failed:", result);
        }
        return;
      }

      // ---------- Facebook ----------
      if (page.type === "facebook") {
        const userParticipant = activeConversation.participants?.data?.find(
          (p) => p.id !== page.id
        );
        if (!userParticipant) return;

        const res = await fetch(
          `https://graph.facebook.com/v18.0/me/messages?access_token=${page.access_token}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              recipient: { id: userParticipant.id },
              message: { text },
              messaging_type: "MESSAGE_TAG",
              tag: "ACCOUNT_UPDATE",
            }),
          }
        );

        const result = await res.json();
        if (res.ok && result.message_id) {
          setMessages((prev) => ({
            ...prev,
            [activeConversation.id]: [
              ...(prev[activeConversation.id] || []),
              {
                from: { name: "You" },
                message: text,
                created_time: new Date().toISOString(),
              },
            ],
          }));
        }
        return;
      }

      // ---------- ChatWidget (text or file) ----------
      if (page.type === "chatwidget") {
        if (file) {
          // send file via FormData
          try {
            const localId = "temp-" + Date.now();
            // Optimistic UI: add temp message
            const optimistic = {
              _tempId: localId,
              sender: "me",
              text: text || null,
              fileUrl: URL.createObjectURL(file),
              fileName: file.name,
              createdAt: new Date().toISOString(),
              uploading: true,
            };
            setMessages((prev) => ({
              ...prev,
              [activeConversation.id]: [
                ...(prev[activeConversation.id] || []),
                optimistic,
              ],
            }));

            setUploading(true);

            const formData = new FormData();
            formData.append("sessionId", activeConversation.id);
            formData.append(
              "storeDomain",
              activeConversation.storeDomain || "myshop.com"
            );
            formData.append("sender", "customer"); // or "me" based on your mapping
            formData.append("file", file);
            // include localId so you can track it server-side if desired (server may ignore)
            formData.append("localId", localId);

            const res = await fetch(`/api/chat`, {
              method: "POST",
              body: formData,
            });
            const data = await res.json().catch(() => null);

            setUploading(false);

            if (data && data.ok && data.message) {
              // replace optimistic message by finding _tempId
              setMessages((prev) => {
                const arr = [...(prev[activeConversation.id] || [])];
                const idx = arr.findIndex((m) => m._tempId === localId);
                if (idx !== -1) {
                  arr[idx] = data.message;
                } else {
                  arr.push(data.message);
                }
                return { ...prev, [activeConversation.id]: arr };
              });
            } else {
              // on failure: mark optimistic as failed
              setMessages((prev) => {
                const arr = [...(prev[activeConversation.id] || [])];
                const idx = arr.findIndex((m) => m._tempId === localId);
                if (idx !== -1) {
                  arr[idx] = {
                    ...arr[idx],
                    uploading: false,
                    failed: true,
                    error: data?.error || "Upload failed",
                  };
                }
                return { ...prev, [activeConversation.id]: arr };
              });
            }
          } catch (err) {
            console.error("File upload failed", err);
            setUploading(false);
          }
          return;
        } else {
          // text message (JSON)
          await fetch(`/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId: activeConversation.id,
              storeDomain: activeConversation.storeDomain || "myshop.com",
              message: text,
              sender: "me",
            }),
          });
          setMessages((prev) => ({
            ...prev,
            [activeConversation.id]: [
              ...(prev[activeConversation.id] || []),
              {
                from: { name: "You" },
                text,
                createdAt: new Date().toISOString(),
              },
            ],
          }));
        }
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setUploading(false);
    }
  };

  /** ----------------- UI ----------------- **/
  return (
    <div
      style={{
        display: "flex",
        height: "90vh",
        border: "1px solid #ddd",
        borderRadius: "12px",
        overflow: "hidden",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* Conversations List */}
      <div
        style={{
          width: "28%",
          borderRight: "1px solid #ddd",
          padding: 15,
          background: "#f9fafb",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
        }}
      >
        <h3 style={{ margin: "0 0 15px 0", color: "#333" }}>💬 Conversations</h3>
        {!conversations.length ? (
          <p style={{ color: "#777", fontStyle: "italic" }}>No conversations</p>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.id}
              style={{
                padding: "10px 12px",
                cursor: "pointer",
                borderRadius: "8px",
                marginBottom: 8,
                transition: "0.2s",
                background:
                  activeConversation?.id === conv.id ? "#e6f0ff" : "transparent",
                fontWeight: activeConversation?.id === conv.id ? "bold" : "normal",
                color: activeConversation?.id === conv.id ? "#1a73e8" : "#333",
              }}
              onClick={() => handleSelectConversation(conv)}
              onMouseOver={(e) => (e.currentTarget.style.background = "#f1f5f9")}
              onMouseOut={(e) =>
                (e.currentTarget.style.background =
                  activeConversation?.id === conv.id ? "#e6f0ff" : "transparent")
              }
            >
              <b>[{conv.pageName}]</b>{" "}
              {conv.participants?.data
                ?.map((p) => p.name || p.username)
                .join(", ") || "Unnamed"}
            </div>
          ))
        )}
      </div>

      {/* Chat Box */}
      <div
        style={{
          flex: 1,
          padding: 15,
          display: "flex",
          flexDirection: "column",
          background: "#fff",
        }}
      >
        <h3
          style={{
            margin: "0 0 15px 0",
            paddingBottom: "10px",
            borderBottom: "1px solid #eee",
            color: "#1a73e8",
          }}
        >
          Chat:{" "}
          {activeConversation
            ? activeConversation.participants?.data
                ?.map((p) => p.name || p.username)
                .join(", ") || "Unnamed"
            : "Select a conversation"}
        </h3>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            border: "1px solid #ccc",
            marginBottom: 12,
            padding: 12,
            borderRadius: "8px",
            background: "#fafafa",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          {activeConversation &&
          messages[activeConversation.id] &&
          messages[activeConversation.id].length ? (
            messages[activeConversation.id].map((msg, idx) => {
              const isMe =
                msg.from?.id === activeConversation.pageId ||
                msg.from?.phone_number_id === activeConversation.pageId ||
                msg.sender === "me" ||
                msg.from === "customer" ||
                msg._tempId; // optimistic sent messages

              const text = msg.text || msg.message || msg.body || (msg.from && msg.from.text);

              return (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    justifyContent: isMe ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      padding: "10px 14px",
                      borderRadius: "18px",
                      background: isMe ? "#1a73e8" : "#e5e5ea",
                      color: isMe ? "#fff" : "#000",
                      maxWidth: "70%",
                      wordWrap: "break-word",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                    }}
                  >
                    {/* text */}
                    {text && <div style={{ fontSize: "0.95em" }}>{text}</div>}

                    {/* file */}
                    {msg.fileUrl && (
                      <div style={{ marginTop: text ? 8 : 0 }}>
                        {/\.(jpe?g|png|gif|webp)$/i.test(msg.fileUrl) ? (
                          <img
                            src={msg.fileUrl}
                            alt={msg.fileName || "image"}
                            style={{ maxWidth: "220px", borderRadius: 10 }}
                          />
                        ) : (
                          <a
                            href={msg.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: isMe ? "#dce6f9" : "#1a73e8" }}
                          >
                            📎 {msg.fileName || "Download file"}
                          </a>
                        )}
                        {msg.uploading && (
                          <div style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>
                            Uploading...
                          </div>
                        )}
                        {msg.failed && (
                          <div
                            style={{
                              fontSize: 12,
                              color: "#ff6b6b",
                              marginTop: 6,
                            }}
                          >
                            Upload failed
                          </div>
                        )}
                      </div>
                    )}

                    <div
                      style={{
                        fontSize: "0.7em",
                        marginTop: "5px",
                        color: isMe ? "#dce6f9" : "#555",
                        textAlign: "right",
                      }}
                    >
                      {msg.timestamp || msg.createdAt || msg.created_time || ""}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p style={{ color: "#777", fontStyle: "italic" }}>No messages yet.</p>
          )}
        </div>

        {activeConversation && (
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              id="dashboard-file-input"
              type="file"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  // send file (no text)
                  sendMessage("", f);
                  e.target.value = "";
                }
              }}
            />
            <label
              htmlFor="dashboard-file-input"
              style={{
                padding: "10px 12px",
                borderRadius: "8px",
                background: "#eef2ff",
                color: "#1a73e8",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              📎
            </label>

            {/* Text input */}
            <input
              ref={textInputRef}
              type="text"
              placeholder="Type a message..."
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                outline: "none",
                transition: "0.2s",
              }}
              onFocus={(e) => (e.target.style.border = "1px solid #1a73e8")}
              onBlur={(e) => (e.target.style.border = "1px solid #ccc")}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const v = e.target.value.trim();
                  if (v) {
                    sendMessage(v, null);
                    e.target.value = "";
                  }
                }
              }}
            />

            {/* Send button */}
            <button
              style={{
                padding: "10px 18px",
                border: "none",
                borderRadius: "8px",
                background: "#1a73e8",
                color: "#fff",
                cursor: "pointer",
                transition: "0.3s",
                fontWeight: "bold",
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = "#1669c1")}
              onMouseOut={(e) => (e.currentTarget.style.background = "#1a73e8")}
              onClick={() => {
                const input = textInputRef.current;
                if (input && input.value.trim()) {
                  sendMessage(input.value.trim(), null);
                  input.value = "";
                }
              }}
            >
              {uploading ? "Uploading..." : "Send"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
