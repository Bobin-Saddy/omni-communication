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
    "EAAHvZAZB8ZCmugBPawu0LBRmXIUyZB5uicNbk2HZChMB61utSg2AbMfg9zzaAo5wMprzetZAgtH9Cer3jL13p86BwZCiZBTZAopeHPqGABdkMPkDyvtQTFgsSTSib48gjcIfdJ729afYO37t2y0vK5qV89lHP2zmM35Uap3ZCMYBYFLMdIxFX63NVQFqrYoo39m2tdkOP8y5lnkHZAzbumrbHJWbtJyVrn97R8G4WC2u1S3cFkZD";
  const WHATSAPP_PHONE_NUMBER_ID = "106660072463312";

  /** ----------------- LOAD CONVERSATIONS ----------------- **/
  useEffect(() => {
    if (!connectedPages.length) return;
    connectedPages.forEach((page) => fetchConversations(page));
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

      // Chat Widget
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

      // WhatsApp / Instagram / Facebook fetching unchanged
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

    // ---------- ChatWidget ----------
    if (page.type === "chatwidget") {
      const optimistic = {
        _tempId: localId,
        sender: "me",
        text: text || null,
        fileUrl: file ? URL.createObjectURL(file) : null, // show image immediately
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

      // if no file, just send text
      if (!file) {
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
        setMessages((prev) => {
          const arr = [...(prev[activeConversation.id] || [])];
          const idx = arr.findIndex((m) => m._tempId === localId);
          if (idx !== -1) arr[idx].uploading = false;
          return { ...prev, [activeConversation.id]: arr };
        });
        return;
      }

      // file upload
      const formData = new FormData();
      formData.append("sessionId", activeConversation.id);
      formData.append("storeDomain", activeConversation.storeDomain || "myshop.com");
      formData.append("sender", "me");
      formData.append("file", file);
      formData.append("localId", localId);

      const res = await fetch(`/api/chat`, { method: "POST", body: formData });
      const data = await res.json().catch(() => null);

      setMessages((prev) => {
        const arr = [...(prev[activeConversation.id] || [])];
        const idx = arr.findIndex((m) => m._tempId === localId);
        if (idx !== -1) {
          arr[idx] = {
            ...arr[idx],
            ...data?.message,
            fileUrl: data?.message?.fileUrl || arr[idx].fileUrl, // fallback to optimistic blob URL
            uploading: false,
            failed: data?.ok ? false : true,
          };
          delete arr[idx]._tempId;
        }
        return { ...prev, [activeConversation.id]: arr };
      });
      return;
    }
  if (page.type === "whatsapp") {
    const convId = activeConversation.id;

    // Optimistic message (only once!)
    const optimistic = {
      _tempId: localId,
      sender: "me",
      text: text || null,
      createdAt: new Date().toISOString(),
      uploading: !!file,
    };

    setMessages((prev) => ({
      ...prev,
      [convId]: [...(prev[convId] || []), optimistic],
    }));

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
        // mark optimistic message as failed
        setMessages((prev) => {
          const arr = [...(prev[convId] || [])];
          const idx = arr.findIndex((m) => m._tempId === localId);
          if (idx !== -1) arr[idx].failed = true;
          return { ...prev, [convId]: arr };
        });
        return;
      }

      // Get platform message id if available (helps dedupe later)
      const platformMessageId = data?.messages?.[0]?.id || null;

      // ✅ Save to DB as outgoing and pass identifying fields for dedupe
      const savePayload = {
        number: activeConversation.userNumber,
        text,
        direction: "outgoing",            // explicit
        platform: "whatsapp",
        platformMessageId,               // may be null
        localId,                         // our temp id so backend can correlate
        createdAt: new Date().toISOString(),
      };

      const dbRes = await fetch(`/whatsapp-messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(savePayload),
      });
      const dbData = await dbRes.json().catch(() => null);

      // Update optimistic message in UI: attach platform id and remove _tempId
      setMessages((prev) => {
        const arr = [...(prev[convId] || [])];
        const idx = arr.findIndex((m) => m._tempId === localId);
        if (idx !== -1) {
          arr[idx] = {
            ...arr[idx],
            // backend may return the final saved message (dbData.message) — prefer that if present
            ...(dbData?.message ? dbData.message : {}),
            platformMessageId: platformMessageId || undefined,
            uploading: false,
          };
          // remove temp id marker (so it won't be found as temp later)
          delete arr[idx]._tempId;
        }
        return { ...prev, [convId]: arr };
      });
    } catch (err) {
      console.error("WhatsApp send/save error:", err);
      setMessages((prev) => {
        const arr = [...(prev[convId] || [])];
        const idx = arr.findIndex((m) => m._tempId === localId);
        if (idx !== -1) {
          arr[idx].failed = true;
          arr[idx].uploading = false;
        }
        return { ...prev, [convId]: arr };
      });
    }

    return; // ✅ stop here so no double optimistic for other providers
  }

  // ---------- Instagram ----------
  if (page.type === "instagram") {
    // (unchanged from your prior code)
    const optimistic = {
      _tempId: localId,
      sender: "me",
      text,
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

    setMessages((prev) => {
      const arr = [...(prev[activeConversation.id] || [])];
      const idx = arr.findIndex((m) => m._tempId === localId);
      if (idx !== -1) {
        arr[idx] = {
          ...arr[idx],
          text,
          sender: "me", // blue color
          uploading: false,
          createdAt: new Date().toISOString(),
        };
      }
      return { ...prev, [activeConversation.id]: arr };
    });

    if (!res.ok) console.error("Instagram send failed:", result);
    return;
  }

  // ---------- Facebook ----------
  if (page.type === "facebook") {
    // (unchanged)
    const optimistic = {
      _tempId: localId,
      sender: "me",
      text,
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

    setMessages((prev) => {
      const arr = [...(prev[activeConversation.id] || [])];
      const idx = arr.findIndex((m) => m._tempId === localId);
      if (idx !== -1) {
        arr[idx] = {
          ...arr[idx],
          text,
          sender: "me",
          uploading: false,
          createdAt: new Date().toISOString(),
        };
      }
      return { ...prev, [activeConversation.id]: arr };
    });

    if (!res.ok) console.error("Facebook send failed:", result);
    return;
  }

    // ---------- WhatsApp / Instagram / Facebook ---------- unchanged
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
                fontWeight:
                  activeConversation?.id === conv.id ? "600" : "400",
              }}
              onClick={() => handleSelectConversation(conv)}
            >
              {conv.participants?.data[0]?.name || "User"}
            </div>
          ))
        )}
      </div>

      {/* Messages Panel */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: 15,
          background: "#fff",
        }}
      >
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            paddingBottom: 10,
          }}
        >
          {(messages[activeConversation?.id] || []).map((msg, idx) => (
            <div
              key={idx}
              style={{
                marginBottom: 10,
                display: "flex",
                justifyContent: msg.sender === "me" ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  background: msg.sender === "me" ? "#007bff" : "#f1f1f1",
                  color: msg.sender === "me" ? "#fff" : "#333",
                  padding: "8px 12px",
                  borderRadius: "12px",
                  maxWidth: "70%",
                  wordBreak: "break-word",
                }}
              >
                {msg.text && <div>{msg.text}</div>}
                {msg.fileUrl && (
                  <img
                    src={msg.fileUrl}
                    alt={msg.fileName || "file"}
                    style={{ maxWidth: "200px", marginTop: 5, borderRadius: 8 }}
                  />
                )}
                {msg.uploading && <div style={{ fontSize: 12 }}>Uploading...</div>}
                {msg.failed && <div style={{ fontSize: 12, color: "red" }}>Failed</div>}
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div style={{ display: "flex", gap: 10 }}>
          <input
            type="text"
            ref={textInputRef}
            placeholder="Type message..."
            style={{ flex: 1, padding: 8, borderRadius: 8, border: "1px solid #ccc" }}
          />
          <input type="file" ref={fileInputRef} />
          <button
            onClick={() =>
              sendMessage(textInputRef.current.value, fileInputRef.current.files[0])
            }
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              background: "#007bff",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
