import React, { useState, useEffect, useRef } from "react";

export default function SocialChatDashboard({ selectedPage, pageAccessTokens }) {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState({});
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, selectedConversation]);

  const fetchConversations = async (page) => {
    if (!page) return;
    const token = pageAccessTokens[page.id];
    if (!token) return;

    try {
      const url =
        page.type === "instagram"
          ? `https://graph.facebook.com/v18.0/${page.id}/conversations?platform=instagram&fields=participants&access_token=${token}`
          : `https://graph.facebook.com/v18.0/${page.id}/conversations?fields=participants&access_token=${token}`;

      const res = await fetch(url);
      const data = await res.json();
      if (!data?.data?.length) return;

      const enriched = await Promise.all(
        data.data.map(async (conv) => {
          const msgRes = await fetch(
            `https://graph.facebook.com/v18.0/${conv.id}/messages?fields=from,message,created_time&limit=1&access_token=${token}`
          );
          const msgData = await msgRes.json();
          const lastMsg = msgData?.data?.[0];

          let userName = "User";
          if (page.type === "instagram") {
            userName = lastMsg?.from?.id !== page.igId ? lastMsg?.from?.name || "Instagram User" : page.name;
          } else {
            const participant = conv.participants?.data?.find((p) => p.name !== page.name);
            userName = participant?.name || "User";
          }

          return { ...conv, userName, businessName: page.name };
        })
      );

      setConversations(enriched);
      setSelectedConversation(enriched[0] || null);
    } catch (err) {
      console.error("Error fetching conversations", err);
    }
  };

  const fetchMessages = async (conv) => {
    if (!conv || !selectedPage) return;
    const token = pageAccessTokens[selectedPage.id];
    if (!token) return;

    try {
      const res = await fetch(
        `https://graph.facebook.com/v18.0/${conv.id}/messages?fields=from,message,created_time&access_token=${token}`
      );
      const data = await res.json();
      const msgs = (data?.data || [])
        .reverse()
        .map((msg) => ({
          id: msg.id,
          from: msg.from?.name || "User",
          message: msg.message,
          created_time: msg.created_time,
        }));

      setMessages((prev) => ({ ...prev, [conv.id]: msgs }));
      setSelectedConversation(conv);
    } catch (err) {
      console.error("Error fetching messages", err);
    }
  };

  useEffect(() => {
    if (selectedPage) fetchConversations(selectedPage);
  }, [selectedPage]);

  return (
    <div style={{ display: "flex", padding: 20 }}>
      <div style={{ flex: 1, marginRight: 20 }}>
        <h2>Conversations</h2>
        <ul>
          {conversations.map((conv) => (
            <li
              key={conv.id}
              style={{
                cursor: "pointer",
                fontWeight: selectedConversation?.id === conv.id ? "bold" : "normal",
              }}
              onClick={() => fetchMessages(conv)}
            >
              {conv.userName}
            </li>
          ))}
        </ul>
      </div>

      <div style={{ flex: 2, border: "1px solid #ccc", padding: 10 }}>
        <h2>Messages</h2>
        {selectedConversation ? (
          <div>
            {(messages[selectedConversation.id] || []).map((msg) => (
              <div key={msg.id}>
                <b>{msg.from}:</b> {msg.message}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div>Select a conversation to see messages</div>
        )}
      </div>
    </div>
  );
}
