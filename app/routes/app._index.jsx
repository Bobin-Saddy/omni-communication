import React, { useEffect, useContext, useRef, useState } from "react";
import { AppContext } from "./AppContext";
import { io } from "socket.io-client";

export default function SocialChatDashboard() {
  function normalizeShopDomain(domain) {
  if (!domain) return null;
  let d = domain.trim().toLowerCase();
  if (!d.endsWith(".myshopify.com")) {
    d = d.replace(/\/+$/, ""); // remove trailing slashes
    d = `${d}.myshopify.com`;
  }
  return d;
}

function getShopDomainFromAppBridge() {
  try {
    // Agar URL me `shop` param hai (common in embedded apps)
    const urlParams = new URLSearchParams(window.location.search);
    const shopParam = urlParams.get("shop");
    if (shopParam) return shopParam.toLowerCase();

    // Agar localStorage me shop save kiya hua hai
    const storedShop = localStorage.getItem("shopDomain");
    if (storedShop) return storedShop.toLowerCase();

    return null;
  } catch (err) {
    console.error("❌ Failed to get shop domain from AppBridge or URL:", err);
    return null;
  }
}


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
    "EAAHvZAZB8ZCmugBPd0HoVJtMtBTY8V8kobwsZCz8OCxcZBk97aaMQf2kq2mhJ3BOsmGKbKlApwvPRy6ZBJZAmgZA5MDa16bVfZB8HzzVxygoIoDGMBeIOxyZCYiI9XJ8HtK26HtA9piZCc1e2pSGskDgSck8bn00gakg7JVwTJMqAZCDyHacsJ7ZANESRvENa33bPs7Ip8nTp3QpxtsRzn8uI17qCHuZAQSCHUIABkYgLwYX8uCwZDZD";
  const WHATSAPP_PHONE_NUMBER_ID = "106660072463312";

  const bottomRef = useRef(null);

useEffect(() => {
  if (bottomRef.current) {
    bottomRef.current.scrollIntoView({ behavior: "smooth" });
  }
}, [messages, activeConversation]);

  /** ----------------- LOAD CONVERSATIONS ----------------- **/
useEffect(() => {
  if (!connectedPages.length) {
    setConversations([]); // ✅ reset when no pages connected
    return;
  }
  connectedPages.forEach((page) => fetchConversations(page));
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


useEffect(() => {
  const evtSource = new EventSource("/whatsapp/subscribe");

evtSource.onmessage = (event) => {
  const msg = JSON.parse(event.data);

  setMessages(prev => ({
    ...prev,
    [msg.number]: [...(prev[msg.number] || []), msg],
  }));

  // 👉 Agar active chat wahi number ka hai, to UI turant scroll/update ho jaye
  if (activeConversation && activeConversation.id === msg.number) {
    setMessages(prev => ({
      ...prev,
      [activeConversation.id]: [...(prev[activeConversation.id] || []), msg],
    }));
  }
};


  return () => evtSource.close();
}, []);

useEffect(() => {
  if (!activeConversation) return;

  const page = connectedPages.find((p) => p.id === activeConversation.pageId);
  if (!page) return;

  let interval;

  const fetchLatestMessages = async () => {
    try {
      if (page.type === "instagram" || page.type === "facebook") {
        const res = await fetch(
          `https://graph.facebook.com/v18.0/${activeConversation.id}/messages?fields=from,to,message,created_time&access_token=${page.access_token}`
        );

        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data?.data)) {
            const formatted = data.data
              .map((msg) => ({
                id: msg.id,
                sender:
                  page.type === "instagram"
                    ? msg.from?.id === page.igId
                      ? "me"
                      : "them"
                    : msg.from?.id === page.id
                    ? "me"
                    : "them",
                text: msg.message,
                createdAt: msg.created_time,
              }))
              .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

            setMessages((prev) => ({
              ...prev,
              [activeConversation.id]: formatted,
            }));
          }
        }
      }
    } catch (err) {
      console.error("Polling error:", err);
    }
  };

  // Fetch first time immediately
  fetchLatestMessages();

  // Then keep polling every 5s
  interval = setInterval(fetchLatestMessages, 2000);

  return () => clearInterval(interval);
}, [activeConversation, connectedPages]);

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
  const shopDomain =
    normalizeShopDomain(page.storeDomain) ||
    (typeof getShopDomainFromAppBridge === "function"
      ? getShopDomainFromAppBridge()
      : null) ||
    localStorage.getItem("shopDomain") ||
    document.querySelector("#oc-chat")?.dataset?.store || // from Liquid data-store attr
    null;

  if (!shopDomain) {
    console.error("❌ No shop domain detected for chatwidget");
    return;
  }

  // Save for future use
  localStorage.setItem("shopDomain", shopDomain);

  const res = await fetch(
    `/api/chat?widget=true&storeDomain=${encodeURIComponent(shopDomain)}`
  );
  const data = await res.json();

  if (Array.isArray(data?.sessions)) {
    // Filter sessions strictly for this store
    const convs = data.sessions
      .filter((s) => s.storeDomain === shopDomain)
      .map((s) => ({
        id: s.sessionId,
        pageId: page.id,
        pageName: page.name,
        pageType: "chatwidget",
        participants: { data: [{ name: s.name }] },
        sessionId: s.sessionId,
        storeDomain: s.storeDomain,
        name: s.name,
      }));

    setConversations((prev) => [
      ...prev.filter((c) => c.pageId !== page.id),
      ...convs,
    ]);

    if (convs.length > 0) {
      const firstConv = convs[0];
      setActiveConversation(firstConv);

      const msgRes = await fetch(
        `/api/chat?storeDomain=${encodeURIComponent(firstConv.storeDomain)}&sessionId=${encodeURIComponent(firstConv.id)}`
      );

      if (msgRes.ok) {
        const msgData = await msgRes.json();
        setMessages((prev) => ({
          ...prev,
          [firstConv.id]: Array.isArray(msgData?.messages) ? msgData.messages : [],
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
    // ---------- ChatWidget ----------
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

    // ---------- Instagram ----------
    if (page.type === "instagram") {
      const res = await fetch(
        `https://graph.facebook.com/v18.0/${conv.id}/messages?fields=from,to,message,created_time&access_token=${page.access_token}`
      );

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.data)) {
          const formatted = data.data
            .map((msg) => {
              const sender =
                msg.from?.id === page.igId ? "me" : "them";
              return {
                id: msg.id,
                sender,
                text: msg.message,
                createdAt: msg.created_time,
              };
            })
            // Sort by timestamp ascending
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

          setMessages((prev) => ({ ...prev, [conv.id]: formatted }));
        }
      }
      return;
    }

    // ---------- Facebook ----------
    if (page.type === "facebook") {
      const res = await fetch(
        `https://graph.facebook.com/v18.0/${conv.id}/messages?fields=from,to,message,created_time&access_token=${page.access_token}`
      );

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.data)) {
          const formatted = data.data
            .map((msg) => {
              const sender = msg.from?.id === page.id ? "me" : "them";
              return {
                id: msg.id,
                sender,
                text: msg.message,
                createdAt: msg.created_time,
              };
            })
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

          setMessages((prev) => ({ ...prev, [conv.id]: formatted }));
        }
      }
      return;
    }

    // ---------- WhatsApp ----------
if (page.type === "whatsapp") {
const res = await fetch(`/whatsapp-messages?number=${conv.id}`);
  if (res.ok) {
    const data = await res.json();
    setMessages((prev) => ({
      ...prev,
    [conv.id]: Array.isArray(data) ? data : [],
    }));
  }
}

  } catch (error) {
    console.error("Error loading messages:", error);
  }
};


/** ----------------- SEND MESSAGE (supports file for chatwidget + whatsapp) ----------------- **/
const sendMessage = async (text = "", file = null) => {
  if (!activeConversation) return;
  const page = connectedPages.find((p) => p.id === activeConversation.pageId);
  if (!page) return;

  const localId = "temp-" + Date.now();
  const userName = activeConversation?.userName || null; // dynamic name

  /** ========== WhatsApp ========== **/
  if (page.type === "whatsapp") {
    const convId = activeConversation.id;
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
      let platformMessageId = null;
      let fileUrl = null;

      if (file) {
        const fd = new FormData();
        fd.append("file", file);
        const uploadRes = await fetch("/upload-image", { method: "POST", body: fd });
        const uploadData = await uploadRes.json();
        if (!uploadData.success) throw new Error("File upload failed");
        fileUrl = uploadData.url;

        const res = await fetch(
          `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages?access_token=${WHATSAPP_TOKEN}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              to: activeConversation.userNumber,
              type: "image",
              image: { link: fileUrl },
            }),
          }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(JSON.stringify(data));
        platformMessageId = data?.messages?.[0]?.id || null;
      } else {
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
        const data = await res.json();
        if (!res.ok) throw new Error(JSON.stringify(data));
        platformMessageId = data?.messages?.[0]?.id || null;
      }

      const savePayload = {
        number: activeConversation.userNumber,
        text,
        fileUrl,
        direction: "outgoing",
        platform: "whatsapp",
        platformMessageId,
        localId,
        createdAt: new Date().toISOString(),
      };
      await fetch(`/whatsapp-messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(savePayload),
      });

      setMessages((prev) => {
        const arr = [...(prev[convId] || [])];
        const idx = arr.findIndex((m) => m._tempId === localId);
        if (idx !== -1) {
          arr[idx] = { ...arr[idx], fileUrl, platformMessageId, uploading: false };
          delete arr[idx]._tempId;
        }
        return { ...prev, [convId]: arr };
      });
    } catch (err) {
      console.error("WhatsApp send/save error:", err);
      setMessages((prev) => {
        const arr = [...(prev[convId] || [])];
        const idx = arr.findIndex((m) => m._tempId === localId);
        if (idx !== -1) arr[idx] = { ...arr[idx], failed: true, uploading: false };
        return { ...prev, [convId]: arr };
      });
    }
    return;
  }

  /** ========== Instagram ========== **/
  if (page.type === "instagram") {
    const optimistic = {
      _tempId: localId,
      sender: "me",
      text,
      createdAt: new Date().toISOString(),
      uploading: !!file,
    };
    setMessages((prev) => ({
      ...prev,
      [activeConversation.id]: [...(prev[activeConversation.id] || []), optimistic],
    }));

    const recipientId =
      activeConversation.recipientId ||
      activeConversation.participants?.data?.find((p) => p.id && p.id !== page.igId)?.id;
    if (!recipientId) return console.error("No IG recipient id");

    const res = await fetch(
      `https://graph.facebook.com/v18.0/${page.pageId}/messages?access_token=${page.access_token}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messaging_type: "RESPONSE", recipient: { id: recipientId }, message: { text } }),
      }
    );
    const result = await res.json();
    setMessages((prev) => {
      const arr = [...(prev[activeConversation.id] || [])];
      const idx = arr.findIndex((m) => m._tempId === localId);
      if (idx !== -1) arr[idx] = { ...arr[idx], text, sender: "me", uploading: false, createdAt: new Date().toISOString() };
      return { ...prev, [activeConversation.id]: arr };
    });
    if (!res.ok) console.error("Instagram send failed:", result);
    return;
  }

  /** ========== Facebook ========== **/
  if (page.type === "facebook") {
    const optimistic = {
      _tempId: localId,
      sender: "me",
      text,
      createdAt: new Date().toISOString(),
      uploading: !!file,
    };
    setMessages((prev) => ({
      ...prev,
      [activeConversation.id]: [...(prev[activeConversation.id] || []), optimistic],
    }));

    const userParticipant = activeConversation.participants?.data?.find((p) => p.id !== page.id);
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
      if (idx !== -1) arr[idx] = { ...arr[idx], text, sender: "me", uploading: false, createdAt: new Date().toISOString() };
      return { ...prev, [activeConversation.id]: arr };
    });
    if (!res.ok) console.error("Facebook send failed:", result);
    return;
  }

  /** ========== ChatWidget ========== **/
if (page.type === "chatwidget") {
  const optimistic = {
    _tempId: localId,
    sender: "me",
    name: activeConversation.userName || `User-${activeConversation.id}`, // dynamic fallback
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
    let payload;

    if (file) {
      // Upload file first
      const fd = new FormData();
      fd.append("file", file);
      const uploadRes = await fetch("/upload-image", { method: "POST", body: fd });
      const uploadData = await uploadRes.json();
      if (!uploadData.success) throw new Error("Upload failed");

const storeDomain =
  activeConversation.storeDomain ||
  page.storeDomain ||
  page.store_domain ||
  localStorage.getItem("shopDomain") ||
  null;

if (!storeDomain) {
  console.error("❌ No shop domain detected for chatwidget sendMessage");
  return;
}

payload = {
  sessionId: activeConversation.id,
  storeDomain,
  sender: "me",
  name: activeConversation.userName || `User-${activeConversation.id}`,
  ...(file
    ? { fileUrl: uploadData.url, fileName: file.name }
    : { message: text, text }),
};

 } else {
  const storeDomain =
    activeConversation.storeDomain ||
    page.storeDomain ||
    page.store_domain ||
    localStorage.getItem("shopDomain") ||
    null;

  if (!storeDomain) {
    console.error("❌ No shop domain detected for chatwidget sendMessage");
    return;
  }

  payload = {
    sessionId: activeConversation.id,
    storeDomain,
    sender: "me",
    name: activeConversation.userName || `User-${activeConversation.id}`,
    message: text,
    text,
  };
}


    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => null);

    // Update optimistic message
    setMessages((prev) => {
      const arr = [...(prev[activeConversation.id] || [])];
      const idx = arr.findIndex((m) => m._tempId === localId);
      if (idx !== -1) {
        if (data?.ok && data.message) {
          arr[idx] = {
            ...arr[idx],
            ...data.message,
            uploading: false,
            failed: false,
          };
        } else {
          arr[idx] = {
            ...arr[idx],
            uploading: false,
            failed: true,
            error: data?.error || "Upload failed",
          };
        }
        delete arr[idx]._tempId;
      }
      return { ...prev, [activeConversation.id]: arr };
    });
  } catch (err) {
    console.error("ChatWidget send error:", err);
  }

  return;
}

};



// Add this helper function at the top of your component
const formatTime = (time) => {
  if (!time) return "";
  const date = new Date(time);
  if (isNaN(date)) return time; // fallback if invalid date

  // Format date: e.g., "Sep 1, 2025"
  const options = { year: "numeric", month: "short", day: "numeric" };
  const formattedDate = date.toLocaleDateString(undefined, options);

  // Format time: e.g., "2:05 PM"
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  const formattedTime = `${hour12}:${minutes} ${ampm}`;

  return `${formattedDate} ${formattedTime}`;
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
  {conversations.filter(c =>
  connectedPages.some(p => p.id === c.pageId)
).length === 0 ? (
  <p style={{ color: "#777", fontStyle: "italic" }}>No conversations</p>
) : (
  conversations
    .filter(c => connectedPages.some(p => p.id === c.pageId))
    .map((conv) => (
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
        onMouseEnter={(e) => {
          if (activeConversation?.id !== conv.id) {
            e.currentTarget.style.background = "#f1f5f9";
          }
        }}
        onMouseLeave={(e) => {
          if (activeConversation?.id !== conv.id) {
            e.currentTarget.style.background = "transparent";
          }
        }}
      >
   {(() => {
  const participantNames =
    conv.participants?.data
      ?.filter(
        (p) =>
          p.name !== WHATSAPP_PHONE_NUMBER_ID &&
          p.username !== WHATSAPP_PHONE_NUMBER_ID
      )
      .map((p) => p.name || p.username)
      .join(", ");

  return participantNames ? participantNames : null; // hide if empty
})()}

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
      ?.filter(p => p.name !== WHATSAPP_PHONE_NUMBER_ID && p.username !== WHATSAPP_PHONE_NUMBER_ID)
      .map((p) => p.name) // no need for p.username if chatwidget
      .join(", ")
  : ""}



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
                      {formatTime(msg.timestamp || msg.createdAt || msg.created_time)}

                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p style={{ color: "#777", fontStyle: "italic" }}>No messages yet.</p>
          )}
            <div ref={bottomRef} />
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
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  const text = e.currentTarget.value.trim();
                  if (text) {
                    sendMessage(text);
                    e.currentTarget.value = "";
                  }
                }
              }}
            />

            {/* Send button */}
            <button
              onClick={() => {
                const text = textInputRef.current.value.trim();
                if (text) {
                  sendMessage(text);
                  textInputRef.current.value = "";
                }
              }}
              style={{
                padding: "10px 18px",
                borderRadius: "8px",
                background: "#1a73e8",
                color: "#fff",
                border: "none",
                fontWeight: "600",
                cursor: "pointer",
                transition: "0.2s",
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = "#1669c1")}
              onMouseOut={(e) => (e.currentTarget.style.background = "#1a73e8")}
            >
              ➤
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

