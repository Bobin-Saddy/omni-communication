import React, { useState, useEffect, useRef } from "react";

export default function Dashboard() {
  const [selectedPage, setSelectedPage] = useState(null);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Load connected page from localStorage
    const page = localStorage.getItem("selectedPage");
    const platform = localStorage.getItem("selectedPlatform");
    if (page && platform) {
      setSelectedPage(JSON.parse(page));
      setSelectedPlatform(platform);
    }
  }, []);

  useEffect(() => {
    if (selectedPage) fetchConversations();
  }, [selectedPage]);

  const fetchConversations = () => {
    // Replace with actual FB Graph API call
    const dummyConversations = [
      { id: "1", name: "User A" },
      { id: "2", name: "User B" },
    ];
    setConversations(dummyConversations);
  };

  const fetchMessages = (conv) => {
    setSelectedConversation(conv);

    const dummyMessages = [
      { id: 1, sender: "user", text: "Hi!" },
      { id: 2, sender: "agent", text: "Hello!" },
    ];
    setMessages(dummyMessages);
  };

  useEffect(() => {
    if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div style={{ padding: 20 }}>
      {selectedPage ? (
        <>
          <h2>{selectedPlatform.toUpperCase()} - {selectedPage.name} Conversations</h2>

          <div style={{ display: "flex", gap: 20 }}>
            <div style={{ flex: 1 }}>
              <h3>Users</h3>
              <ul>
                {conversations.map((conv) => (
                  <li key={conv.id} onClick={() => fetchMessages(conv)} style={{ cursor: "pointer", margin: 5 }}>
                    {conv.name}
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ flex: 2 }}>
              <h3>Messages with {selectedConversation?.name}</h3>
              <div style={{ border: "1px solid #ccc", padding: 10, minHeight: 200 }}>
                {messages.map((msg) => (
                  <p key={msg.id} style={{ textAlign: msg.sender === "agent" ? "right" : "left" }}>
                    <strong>{msg.sender}:</strong> {msg.text}
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
