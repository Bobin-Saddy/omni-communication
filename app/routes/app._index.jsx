import React, { useState, useEffect, useRef } from "react";

export default function Dashboard({ selectedPlatform, selectedPage }) {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  // Fetch conversations when a page is connected
  useEffect(() => {
    if (selectedPlatform && selectedPage) fetchConversations(selectedPlatform, selectedPage.id);
  }, [selectedPlatform, selectedPage]);

  const fetchConversations = (platform, pageId) => {
    const endpoint =
      platform === "facebook"
        ? `/${pageId}/conversations?fields=participants,updated_time`
        : `/${pageId}/conversations?fields=participants,updated_time`;

    window.FB.api(endpoint, "GET", function (response) {
      if (!response || response.error) console.error("Conversations Error:", response?.error);
      else setConversations(response.data);
    });
  };

  const fetchMessages = (conversation) => {
    setSelectedConversation(conversation);
    const convoId = conversation.id;
    const endpoint = `/${convoId}/messages?fields=from,message,created_time`;

    window.FB.api(endpoint, "GET", function (response) {
      if (!response || response.error) console.error("Messages Error:", response?.error);
      else setMessages(response.data);
    });
  };

  // Auto scroll
  useEffect(() => {
    if (messagesEndRef.current)
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div style={{ padding: 20 }}>
      {selectedPage ? (
        <>
          <h2>
            {selectedPlatform.toUpperCase()} - {selectedPage.name} Conversations
          </h2>

          <div style={{ display: "flex", gap: 20 }}>
            {/* Users / Conversations */}
            <div style={{ flex: 1 }}>
              <h3>Users</h3>
              <ul>
                {conversations.map((conv) => (
                  <li
                    key={conv.id}
                    onClick={() => fetchMessages(conv)}
                    style={{ cursor: "pointer", margin: 5 }}
                  >
                    {conv.participants?.data.map((p) => p.name).join(", ")}
                  </li>
                ))}
              </ul>
            </div>

            {/* Messages */}
            <div style={{ flex: 2 }}>
              <h3>
                Messages with{" "}
                {selectedConversation?.participants?.data.map((p) => p.name).join(", ")}
              </h3>
              <div style={{ border: "1px solid #ccc", padding: 10, minHeight: 300 }}>
                {messages.map((msg) => (
                  <p
                    key={msg.id}
                    style={{
                      textAlign: msg.from?.id === selectedPage.id ? "right" : "left",
                    }}
                  >
                    <strong>{msg.from?.name}:</strong> {msg.message}
                  </p>
                ))}
                <div ref={messagesEndRef}></div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <p>Please connect a page from Settings to view conversations.</p>
      )}
    </div>
  );
}
