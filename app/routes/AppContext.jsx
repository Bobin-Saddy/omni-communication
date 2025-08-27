import React, { createContext, useState } from "react";

// Create context
export const AppContext = createContext();

// Provider component
export const GlobalProvider = ({ children }) => {
  const [connectedPages, setConnectedPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState(null);
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState(null);

  return (
    <AppContext.Provider
      value={{
        connectedPages,
        setConnectedPages,
        selectedPage,
        setSelectedPage,
        messages,
        setMessages,
        conversations,
        setConversations,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
