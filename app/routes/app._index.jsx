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

  const WHATSAPP_TOKEN = "EAAHv...ZDZD"; // keep your token
  const WHATSAPP_PHONE_NUMBER_ID = "106660072463312";

  useEffect(() => {
    if (!connectedPages.length) return;
    connectedPages.forEach((page) => fetchConversations(page));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectedPages]);

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
      return () => es.close();
    }
  }, [activeConversation, setMessages]);

  const fetchConversations = async (page) => {
    try {
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

  // ----------------- FIXED sendMessage -----------------
  const sendMessage = async (text = "", file = null) => {
    if (!activeConversation) return;
    const page = connectedPages.find((p) => p.id === activeConversation.pageId);
    if (!page) return;

    try {
      // other channels kept same (WhatsApp/IG/FB) — omitted here for brevity in this snippet
      // ---------- ChatWidget (text or file) ----------
      if (page.type === "chatwidget") {
        if (file) {
          const localId = "temp-" + Date.now();

          // optimistic message (shows blob image immediately)
          const optimistic = {
            _tempId: localId,
            sender: "me",                 // <-- IMPORTANT: mark as 'me'
            text: text || null,
            fileUrl: URL.createObjectURL(file), // blob URL for immediate preview
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

          try {
            const formData = new FormData();
            formData.append("sessionId", activeConversation.id);
            formData.append(
              "storeDomain",
              activeConversation.storeDomain || "myshop.com"
            );
            // <-- SEND SENDER AS "me" (fixes your issue)
            formData.append("sender", "me");
            formData.append("file", file);
            formData.append("localId", localId); // optional: server can echo it back

            const res = await fetch(`/api/chat`, {
              method: "POST",
              body: formData,
            });

            const data = await res.json().catch(() => null);
            setUploading(false);

            if (data && data.ok && data.message) {
              // server returned saved message
              let serverMsg = data.message;

              // FALLBACK: server might only return fileName (no fileUrl)
              if (!serverMsg.fileUrl && serverMsg.fileName) {
                // if fileName is already an absolute URL use it, else build path
                if (/^https?:\/\//i.test(serverMsg.fileName)) {
                  serverMsg.fileUrl = serverMsg.fileName;
                } else {
                  // adjust this fallback to match your server storage path
                  const fallbackPath = `/uploads/${serverMsg.fileName}`;
                  // make absolute
                  serverMsg.fileUrl =
                    serverMsg.fileUrl || window.location.origin + fallbackPath;
                }
              }

              // replace optimistic message with server message (match by localId)
              setMessages((prev) => {
                const arr = [...(prev[activeConversation.id] || [])];
                const idx = arr.findIndex((m) => m._tempId === localId);
                if (idx !== -1) {
                  arr[idx] = serverMsg;
                } else {
                  arr.push(serverMsg);
                }
                return { ...prev, [activeConversation.id]: arr };
              });
            } else {
              // mark optimistic as failed
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
            setMessages((prev) => {
              const arr = [...(prev[activeConversation.id] || [])];
              const idx = arr.findIndex((m) => m._tempId === localId);
              if (idx !== -1) {
                arr[idx] = { ...arr[idx], uploading: false, failed: true };
              }
              return { ...prev, [activeConversation.id]: arr };
            });
          }

          return;
        } else {
          // text-only
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

  // ----------------- UI & Render (file rendering updated) -----------------
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
                msg.from === "me" ||
                msg._tempId;

              const text = msg.text || msg.message || msg.body || (msg.from && msg.from.text);

              // compute displayable file URL (handles blob, server fileUrl, or fallback from fileName)
              let displayFileUrl = null;
              if (msg.fileUrl) {
                displayFileUrl = msg.fileUrl;
              } else if (msg.fileName) {
                if (/^https?:\/\//i.test(msg.fileName)) {
                  displayFileUrl = msg.fileName;
                } else {
                  // fallback path (change if your server stores files somewhere else)
                  displayFileUrl = window.location.origin + `/uploads/${msg.fileName}`;
                }
              }

              const isImage = displayFileUrl && /\.(jpe?g|png|gif|webp|bmp)$/i.test(displayFileUrl);

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
                    {text && <div style={{ fontSize: "0.95em" }}>{text}</div>}

                    {displayFileUrl && (
                      <div style={{ marginTop: text ? 8 : 0 }}>
                        {isImage ? (
                          <img
                            src={displayFileUrl}
                            alt={msg.fileName || "image"}
                            style={{ maxWidth: "220px", borderRadius: 10 }}
                          />
                        ) : (
                          <a
                            href={displayFileUrl}
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
            <input
              ref={fileInputRef}
              id="dashboard-file-input"
              type="file"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
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
