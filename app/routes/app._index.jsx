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

  /** ----------------- SSE for chatwidget ----------------- **/
  useEffect(() => {
    if (activeConversation?.pageType !== "chatwidget") return;

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
            {
              text: data.text || "",
              fileUrl: data.fileUrl || null,
              sender: data.sender || "them",
              createdAt: data.createdAt || new Date().toISOString(),
            },
          ],
        }));
      } catch (e) {
        console.warn("SSE parse error", e);
      }
    };

    es.onerror = (err) => {
      console.warn("SSE error", err);
      es.close();
    };

    return () => es.close();
  }, [activeConversation]);

  /** ----------------- FETCH CONVERSATIONS ----------------- **/
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
            [conv.id]: Array.isArray(data?.messages)
              ? data.messages.map((m) => ({
                  ...m,
                  sender: m.sender === "me" ? "me" : "them",
                }))
              : [],
          }));
        }
        return;
      }

      if (page.type === "instagram") {
        const res = await fetch(
          `https://graph.facebook.com/v18.0/${conv.id}/messages?fields=from,to,message,created_time&access_token=${page.access_token}`
        );
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data?.data)) {
            const formatted = data.data
              .map((msg) => ({
                id: msg.id,
                sender: msg.from?.id === page.igId ? "me" : "them",
                text: msg.message,
                createdAt: msg.created_time,
              }))
              .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

            setMessages((prev) => ({ ...prev, [conv.id]: formatted }));
          }
        }
        return;
      }

      if (page.type === "facebook") {
        const res = await fetch(
          `https://graph.facebook.com/v18.0/${conv.id}/messages?fields=from,to,message,created_time&access_token=${page.access_token}`
        );
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data?.data)) {
            const formatted = data.data
              .map((msg) => ({
                id: msg.id,
                sender: msg.from?.id === page.id ? "me" : "them",
                text: msg.message,
                createdAt: msg.created_time,
              }))
              .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

            setMessages((prev) => ({ ...prev, [conv.id]: formatted }));
          }
        }
        return;
      }

      if (page.type === "whatsapp") {
        const res = await fetch(`/whatsapp-messages?number=${conv.id}`);
        if (res.ok) {
          const data = await res.json();
          setMessages((prev) => ({
            ...prev,
            [conv.id]: Array.isArray(data)
              ? data.map((msg) => ({
                  ...msg,
                  sender: msg.direction === "outgoing" ? "me" : "them",
                }))
              : [],
          }));
        }
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  /** ----------------- SEND MESSAGE ----------------- **/
  const sendMessage = async (text = "", file = null) => {
    if (!activeConversation) return;
    const page = connectedPages.find((p) => p.id === activeConversation.pageId);
    if (!page) return;

    const localId = "temp-" + Date.now();
    const optimistic = {
      _tempId: localId,
      sender: "me",
      text: text || null,
      fileUrl: file ? URL.createObjectURL(file) : null,
      fileName: file?.name || null,
      createdAt: new Date().toISOString(),
      uploading: !!file,
    };

    // Add optimistic message
    setMessages((prev) => ({
      ...prev,
      [activeConversation.id]: [
        ...(prev[activeConversation.id] || []),
        optimistic,
      ],
    }));

    try {
      // ---------- WhatsApp ----------
      if (page.type === "whatsapp") {
        const res = await fetch(
          `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              to: activeConversation.id,
              type: file ? "document" : "text",
              ...(file
                ? { document: { link: "https://example.com/file.pdf", filename: file.name } }
                : { text: { body: text } }),
            }),
          }
        );
        const data = await res.json();

        // Replace optimistic with actual DB version
        setMessages((prev) => {
          const arr = [...(prev[activeConversation.id] || [])];
          const idx = arr.findIndex((m) => m._tempId === localId);
          if (idx !== -1) {
            arr[idx] = {
              ...arr[idx],
              _tempId: undefined,
              id: data?.messages?.[0]?.id || undefined,
              text: text || null,
              uploading: false,
              createdAt: new Date().toISOString(),
            };
          }
          return { ...prev, [activeConversation.id]: arr };
        });
      }

      // ---------- ChatWidget ----------
      if (page.type === "chatwidget") {
        const formData = new FormData();
        formData.append("storeDomain", activeConversation.storeDomain || "");
        formData.append("sessionId", activeConversation.id);
        if (text) formData.append("text", text);
        if (file) formData.append("file", file);

        const res = await fetch("/api/chat/send", { method: "POST", body: formData });
        const data = await res.json();

        setMessages((prev) => {
          const arr = [...(prev[activeConversation.id] || [])];
          const idx = arr.findIndex((m) => m._tempId === localId);
          if (idx !== -1) {
            arr[idx] = {
              ...arr[idx],
              _tempId: undefined,
              id: data?.id || undefined,
              uploading: false,
              createdAt: new Date().toISOString(),
            };
          }
          return { ...prev, [activeConversation.id]: arr };
        });
      }

      // TODO: Instagram & Facebook API send here if needed
    } catch (error) {
      console.error("Send message error", error);
      setMessages((prev) => ({
        ...prev,
        [activeConversation.id]: (prev[activeConversation.id] || []).filter(
          (m) => m._tempId !== localId
        ),
      }));
    }
  };

  /** ----------------- HANDLE ENTER ----------------- **/
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const text = textInputRef.current.value.trim();
      if (!text) return;
      textInputRef.current.value = "";
      sendMessage(text);
    }
  };

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
          width: "30%",
          borderRight: "1px solid #ddd",
          padding: 10,
          overflowY: "auto",
        }}
      >
        <h3>Conversations</h3>
        {!conversations.length ? (
          <p>No conversations</p>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => handleSelectConversation(conv)}
              style={{
                padding: "8px 12px",
                marginBottom: 6,
                borderRadius: 6,
                backgroundColor:
                  activeConversation?.id === conv.id ? "#e0f0ff" : "#fff",
                cursor: "pointer",
                border: "1px solid #eee",
              }}
            >
              {conv.participants?.data?.[0]?.name || conv.id}
            </div>
          ))
        )}
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div
          style={{
            flex: 1,
            padding: 10,
            overflowY: "auto",
            backgroundColor: "#fafafa",
          }}
        >
          {(messages[activeConversation?.id] || []).map((msg, idx) => (
            <div
              key={msg._tempId || msg.id || idx}
              style={{
                marginBottom: 8,
                textAlign: msg.sender === "me" ? "right" : "left",
              }}
            >
              <div
                style={{
                  display: "inline-block",
                  padding: "6px 12px",
                  borderRadius: 12,
                  backgroundColor:
                    msg.sender === "me" ? "#cce5ff" : "#e2e2e2",
                  maxWidth: "70%",
                  wordBreak: "break-word",
                  opacity: msg.uploading ? 0.6 : 1,
                }}
              >
                {msg.fileUrl ? (
                  <a
                    href={msg.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {msg.fileName || "File"}
                  </a>
                ) : (
                  msg.text
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div style={{ padding: 10, borderTop: "1px solid #ddd" }}>
          <textarea
            ref={textInputRef}
            placeholder="Type a message..."
            rows={2}
            style={{ width: "80%", borderRadius: 6, padding: 6 }}
            onKeyDown={handleKeyPress}
          />
          <button
            style={{
              padding: "6px 12px",
              marginLeft: 6,
              borderRadius: 6,
              cursor: "pointer",
            }}
            onClick={() => {
              const text = textInputRef.current.value.trim();
              if (!text) return;
              textInputRef.current.value = "";
              sendMessage(text);
            }}
          >
            Send
          </button>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) sendMessage("", file);
            }}
          />
          <button
            style={{ marginLeft: 6 }}
            onClick={() => fileInputRef.current.click()}
          >
            Attach
          </button>
        </div>
      </div>
    </div>
  );
}
