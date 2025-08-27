import React, { createContext, useState } from "react";

export const AppContext = createContext();

export const GlobalProvider = ({ children }) => {
  const [connectedPages, setConnectedPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState({}); // store messages per conversation

  return (
    <AppContext.Provider
      value={{
 connectedPages,
    setConnectedPages,
    selectedPage,
    setSelectedPage,
    conversations,
    setConversations,
    messages,
    setMessages,
    activeConversation,
    setActiveConversation,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
