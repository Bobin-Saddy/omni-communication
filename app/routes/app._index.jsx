import React, { useState, useEffect } from "react";

export default function Dashboard({ selectedPlatform, selectedUser, setSelectedUser }) {
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (selectedPlatform) {
      // Fetch user conversations based on platform
      fetchUserConversations(selectedPlatform);
    }
  }, [selectedPlatform]);

  const fetchUserConversations = async (platform) => {
    // Example: Replace this with actual Shopify/FB/IG API call
    const dummyUsers = platform === "facebook"
      ? [{ id: 1, name: "John Doe" }, { id: 2, name: "Jane Smith" }]
      : [{ id: 1, name: "Alice" }, { id: 2, name: "Bob" }];

    setUsers(dummyUsers);
  };

  const fetchMessages = async (userId) => {
    // Example: Replace this with actual message fetching API
    const dummyMessages = [
      { id: 1, text: "Hello!", sender: "user" },
      { id: 2, text: "Hi! How can I help?", sender: "agent" },
    ];
    setMessages(dummyMessages);
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>{selectedPlatform?.toUpperCase()} Conversations</h2>
      <div style={{ display: "flex", gap: "20px" }}>
        {/* Users list */}
        <div style={{ flex: 1 }}>
          <h3>Users</h3>
          <ul>
            {users.map((user) => (
              <li
                key={user.id}
                onClick={() => {
                  setSelectedUser(user);
                  fetchMessages(user.id);
                }}
                style={{ cursor: "pointer", margin: "5px 0" }}
              >
                {user.name}
              </li>
            ))}
          </ul>
        </div>

        {/* Messages list */}
        <div style={{ flex: 2 }}>
          <h3>Messages with {selectedUser?.name}</h3>
          <div style={{ border: "1px solid #ccc", padding: 10, minHeight: 300 }}>
            {messages.map((msg) => (
              <p key={msg.id} style={{ textAlign: msg.sender === "agent" ? "right" : "left" }}>
                <strong>{msg.sender}:</strong> {msg.text}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
