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

  const WHATSAPP_TOKEN = "EAAHvZAZB8ZCmugBPZAIqTmLVEjmRTQ1AMqXO1Ehn6gtok1mJiKZB9lak3ZCE97I4akjsfV0Pke3lq05TOY6XZAIEWCJ6jzV6ewvlXKvBsB1jImP9SyP2y01lvgNXNMFjVKrAcdJMP4yP1H7zhfaHvc2PZA0eBDmfRk3aUlyuKawEPLRbJtPY9xvvN0Svr4SogANjKzkyR4I5AXqEGSio1rsfY8RZAeegedtudplsuKiiKsGoZD";
  const WHATSAPP_PHONE_NUMBER_ID = "106660072463312";

  /** ----------------- LOAD CONVERSATIONS ----------------- **/
  useEffect(() => {
    if (!connectedPages.length) return;
    connectedPages.forEach((page) => fetchConversations(page));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectedPages]);

  /** ----------------- SSE for chatwidget (real-time) ----------------- **/
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
              sender: data.sender === "me" ? "me" : "them",
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
      // WhatsApp
      if (page.type === "whatsapp") {
        const res = await fetch("/whatsapp-users");
        const users = await res.json();
        const convs = (users || []).map((u) => ({
          id: u.number,
          pageId: page.id,
          pageName: "WhatsApp",
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

      // Instagram / Facebook / Chatwidget unchanged (keep your version)...
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
      // ---------- WhatsApp ----------
      if (page.type === "whatsapp") {
        const res = await fetch(`/whatsapp-messages?number=${conv.id}`);
        if (res.ok) {
          const data = await res.json();
          setMessages((prev) => ({
            ...prev,
            [conv.id]: Array.isArray(data)
              ? data.map((msg) => ({
                  ...msg,
                  sender: msg.fromMe ? "me" : "them", // normalize
                }))
              : [],
          }));
        }
        return;
      }

      // Instagram / Facebook / Chatwidget unchanged (keep your version)...
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
        try {
          const res = await fetch(
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
          const data = await res.json().catch(() => null);

          if (!res.ok) {
            console.error("WhatsApp send failed:", data);
            setMessages((prev) => {
              const arr = [...(prev[activeConversation.id] || [])];
              const idx = arr.findIndex((m) => m._tempId === localId);
              if (idx !== -1) arr[idx].failed = true;
              return { ...prev, [activeConversation.id]: arr };
            });
            return;
          }

          // Save to DB → use fromMe for persistence
          await fetch(`/whatsapp-messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              number: activeConversation.userNumber,
              text,
              fromMe: true, // ✅ fix persistence
              createdAt: new Date().toISOString(),
            }),
          });

          // Update optimistic
          setMessages((prev) => {
            const arr = [...(prev[activeConversation.id] || [])];
            const idx = arr.findIndex((m) => m._tempId === localId);
            if (idx !== -1) {
              arr[idx] = {
                ...arr[idx],
                sender: "me",
                uploading: false,
                createdAt: new Date().toISOString(),
              };
              delete arr[idx]._tempId;
            }
            return { ...prev, [activeConversation.id]: arr };
          });
        } catch (err) {
          console.error("WhatsApp send/save error:", err);
        }
        return;
      }

      // Instagram / Facebook / Chatwidget unchanged (keep your version)...
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  /** ----------------- UI ----------------- **/
  return (
    <div style={{ display: "flex", height: "90vh" }}>
      {/* Conversations List */}
      <div style={{ width: "28%", borderRight: "1px solid #ddd", padding: 15 }}>
        <h3>💬 Conversations</h3>
        {conversations.map((conv) => (
          <div
            key={conv.id}
            onClick={() => handleSelectConversation(conv)}
            style={{
              padding: "10px",
              cursor: "pointer",
              background:
                activeConversation?.id === conv.id ? "#e6f0ff" : "transparent",
              fontWeight: activeConversation?.id === conv.id ? "bold" : "normal",
            }}
          >
            <b>[{conv.pageName}]</b>{" "}
            {conv.pageType === "whatsapp"
              ? conv.userNumber // ✅ show number not "me"
              : conv.participants?.data
                  ?.map((p) => p.name || p.username)
                  .join(", ") || "Unnamed"}
          </div>
        ))}
      </div>

      {/* Chat Box */}
      <div style={{ flex: 1, padding: 15, display: "flex", flexDirection: "column" }}>
        <h3>
          Chat:{" "}
          {activeConversation
            ? activeConversation.pageType === "whatsapp"
              ? activeConversation.userNumber
              : activeConversation.participants?.data
                  ?.map((p) => p.name || p.username)
                  .join(", ")
            : "Select a conversation"}
        </h3>

        <div style={{ flex: 1, overflowY: "auto", border: "1px solid #ccc", padding: 12 }}>
          {activeConversation &&
          messages[activeConversation.id] &&
          messages[activeConversation.id].length ? (
            messages[activeConversation.id].map((msg, idx) => {
              const isMe = msg.sender === "me"; // ✅ unified
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
                    }}
                  >
                    {msg.text}
                    <div style={{ fontSize: "0.7em", marginTop: "5px" }}>
                      {msg.createdAt}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p>No messages yet.</p>
          )}
        </div>

        {activeConversation && (
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <input
              ref={textInputRef}
              type="text"
              placeholder="Type a message..."
              style={{ flex: 1 }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const v = e.target.value.trim();
                  if (v) {
                    sendMessage(v);
                    e.target.value = "";
                  }
                }
              }}
            />
            <button
              onClick={() => {
                const v = textInputRef.current.value.trim();
                if (v) {
                  sendMessage(v);
                  textInputRef.current.value = "";
                }
              }}
            >
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
