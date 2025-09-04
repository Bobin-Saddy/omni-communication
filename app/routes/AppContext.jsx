import React, { createContext, useState } from "react";

export const AppContext = createContext();

export const GlobalProvider = ({ children, shopDomain: initialShopDomain = "" }) => {
  const [connectedPages, setConnectedPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState({}); // store messages per conversation
  const [shopDomain, setShopDomain] = useState(initialShopDomain); // ✅ added shopDomain

  return (
    <AppContext.Provider
      value={{
        connectedPages,
        setConnectedPages,
        selectedPage,
        setSelectedPage,
        conversations,
        setConversations,
        activeConversation,
        setActiveConversation,
        messages,
        setMessages,
        shopDomain,       // ✅ expose shopDomain
        setShopDomain,    // optional: in case you need to update
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
