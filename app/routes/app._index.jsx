import { useEffect, useContext, useRef } from "react";
import { AppContext } from "./AppContext";
import { FiTrash2, FiUserMinus, FiUserPlus } from "react-icons/fi";

export default function SocialChatDashboard() {
  const {
    conversations,
    activeConversation,
    setActiveConversation,
    messages,
    setMessages,
  } = useContext(AppContext);

  const messagesEndRef = useRef(null);

  // ✅ Auto scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeConversation]);

  const WHATSAPP_TOKEN =
    "EAAHvZAZB8ZCmugBPT9NT85FLIES5xzEtGZCWq5jZAZBrVvYfkiFbCq1OLdzZCzVzVtRxjdI5PKgUQZBO5JTTNJl5B3bzbX74mZAQg8ty9CL4orxBcdq08ISeZC2A3ZCZBWLxwhBxZBVdisAnNuZB9ZAEZAOcjFQO3YctzonA381s5OPMjOcQsSZCJrcAbOjqpfATEM1eCaZBgCleBquTGqbTFNZA0oAIm9ZCuZAwj4EJ0PUNju566I3nZCqQZDZD";
  const WHATSAPP_PHONE_NUMBER_ID = "106660072463312";

  /** ----------------- LOAD CONVERSATIONS ----------------- **/
  useEffect(() => {
    if (!connectedPages.length) return;
    connectedPages.forEach((page) => fetchConversations(page));
  }, [connectedPages]);

  useEffect(() => {
    if (activeConversation?.pageType === "chatwidget") {
      const es = new EventSource(
        `/api/chat/stream?sessionId=${activeConversation.id}&storeDomain=${activeConversation.storeDomain}`
      );

      es.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setMessages((prev) => ({
          ...prev,
          [activeConversation.id]: [
            ...(prev[activeConversation.id] || []),
            data,
          ],
        }));
      };

      return () => es.close();
    }
  }, [activeConversation]);

  /** ----------------- FETCH CONVERSATIONS ----------------- **/
  const fetchConversations = async (page) => {
    try {
      // ✅ WhatsApp
      if (page.type === "whatsapp") {
        const res = await fetch("/whatsapp-users");
        const users = await res.json();
        const convs = users.map((u) => ({
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

if (page.type === "instagram") {
  const res = await fetch(
    `https://graph.facebook.com/v18.0/${page.pageId}/conversations?platform=instagram&fields=id,participants,updated_time&access_token=${page.access_token}`
  );
  const data = await res.json();
  if (!Array.isArray(data?.data)) return;

  const conversationsWithNames = data.data.map((conv) => {
    const parts = conv.participants?.data || [];
    // IG threads include the IG business (page.igId) and the user.
    const other = parts.find(p => p.id !== page.igId && p.id !== page.pageId) || {};
    const userName = other.name || other.username || "Instagram User";
    return {
     id: conv.id,
      pageId: page.id,          // same as page.pageId after fix in Settings
      pageName: page.name,
      pageType: "instagram",
      participants: { data: [{ id: other.id, name: userName }] }, // keep id!
      recipientId: other.id,    // store to send later
      updated_time: conv.updated_time,
    };
  });

   setConversations((prev) => [
     ...prev.filter((c) => c.pageId !== page.id),
     ...conversationsWithNames,
   ]);
   return;
}



      // ✅ Facebook
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

      // ✅ Chat Widget
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

  /** ----------------- FETCH MESSAGES ----------------- **/
  const fetchMessages = async (conversationId, page) => {
    try {
      if (page.type === "whatsapp") {
        const res = await fetch(`/whatsapp-messages?number=${conversationId}`);
        const data = await res.json();
        setMessages((prev) => ({ ...prev, [conversationId]: data }));
        return;
      }

if (page.type === "instagram" || page.type === "facebook") {
  const url = `https://graph.facebook.com/v18.0/${conversationId}/messages?fields=from,to,message,created_time&access_token=${page.access_token}`;
  const res = await fetch(url);
  const data = await res.json();
  setMessages((prev) => ({
    ...prev,
    [conversationId]: Array.isArray(data?.data) ? data.data : [],
  }));
  return;
}

      if (page?.type === "chatwidget") {
        const res = await fetch(
          `/api/chat?storeDomain=${encodeURIComponent(
            page.shopDomain || "myshop.com"
          )}&sessionId=${encodeURIComponent(conversationId)}`
        );

        if (res.ok) {
          const data = await res.json();
          setMessages((prev) => ({
            ...prev,
            [conversationId]: Array.isArray(data?.messages)
              ? data.messages
              : [],
          }));
        }
        return;
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
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
            [conv.id]: Array.isArray(data?.messages) ? data.messages : [],
          }));
        }
      } else if (page.type === "instagram" || page.type === "facebook") {
        const res = await fetch(
          `https://graph.facebook.com/v18.0/${conv.id}/messages?fields=from,to,message,created_time&access_token=${page.access_token}`
        );

        if (res.ok) {
          const data = await res.json();
          setMessages((prev) => ({
            ...prev,
            [conv.id]: Array.isArray(data?.data) ? data.data : [],
          }));
        }
      } else if (page.type === "whatsapp") {
        const res = await fetch(`/whatsapp-messages?number=${conv.id}`);
        const data = await res.json();
        setMessages((prev) => ({ ...prev, [conv.id]: data }));
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  /** ----------------- SEND MESSAGE ----------------- **/
  const sendMessage = async (text) => {
    if (!activeConversation) return;
    const page = connectedPages.find((p) => p.id === activeConversation.pageId);
    if (!page) return;

    try {
      // ✅ WhatsApp
      if (page.type === "whatsapp") {
        await fetch(
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
        setMessages((prev) => ({
          ...prev,
          [activeConversation.id]: [
            ...(prev[activeConversation.id] || []),
            {
              from: "You",
              message: text,
              timestamp: new Date().toISOString(),
            },
          ],
        }));
        return;
      }

      // ✅ Instagram (API for send requires permissions – simulate for now)
 if (page.type === "instagram") {
   const recipientId =
     activeConversation.recipientId ||
     activeConversation.participants?.data?.find(p => p.id && p.id !== page.igId)?.id;
   if (!recipientId) {
     console.error("No IG recipient id on conversation");
     return;
   }

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
    if (res.ok && result.id) {
      setMessages((prev) => ({
        ...prev,
        [activeConversation.id]: [
          ...(prev[activeConversation.id] || []),
          { from: { name: "You" }, message: text, created_time: new Date().toISOString() },
        ],
      }));
    } else {
      console.error("Instagram send failed:", result);
    }
    return;
 }

      // ✅ Facebook
      if (page.type === "facebook") {
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
        if (res.ok && result.message_id) {
          setMessages((prev) => ({
            ...prev,
            [activeConversation.id]: [
              ...(prev[activeConversation.id] || []),
              {
                from: { name: "You" },
                message: text,
                created_time: new Date().toISOString(),
              },
            ],
          }));
        }
        return;
      }

      // ✅ ChatWidget
      if (page.type === "chatwidget") {
        await fetch(`/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: activeConversation.id,
            storeDomain: activeConversation.storeDomain || "myshop.com",
            message: text,
          }),
        });
        setMessages((prev) => ({
          ...prev,
          [activeConversation.id]: [
            ...(prev[activeConversation.id] || []),
            {
              from: { name: "You" },
              message: text,
              created_time: new Date().toISOString(),
            },
          ],
        }));
      }
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  /** ----------------- UI ----------------- **/

  return (
    <div className="flex h-screen font-sans text-sm text-gray-800">
      {/* Sidebar */}
      <div className="w-1/4 border-r bg-white flex flex-col">
        <div className="p-3 border-b font-semibold text-purple-600">
          Online 🔔
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <p className="p-4 text-gray-500">No conversations</p>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={`flex items-center p-3 cursor-pointer border-b hover:bg-gray-100 ${
                  activeConversation?.id === conv.id
                    ? "bg-purple-50 border-l-4 border-purple-500"
                    : ""
                }`}
                onClick={() => setActiveConversation(conv)}
              >
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center mr-3">
                  {conv.participants?.data?.[0]?.name?.[0] || "?"}
                </div>
                <div className="flex-1">
                  <div className="font-medium">
                    {conv.participants?.data?.map((p) => p.name).join(", ")}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {messages[conv.id]?.[0]?.text || "No messages yet"}
                  </div>
                </div>
                <div className="text-xs text-gray-400 ml-2">Aug 27</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {/* Header */}
        {activeConversation ? (
          <div className="flex items-center justify-between border-b bg-white p-3">
            <div className="font-semibold text-lg">
              {activeConversation.participants?.data
                ?.map((p) => p.name)
                .join(", ")}
            </div>
            <div className="flex space-x-4 text-gray-500">
              <FiUserPlus className="cursor-pointer hover:text-purple-600" />
              <FiUserMinus className="cursor-pointer hover:text-red-500" />
              <FiTrash2 className="cursor-pointer hover:text-red-600" />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Select a conversation
          </div>
        )}

        {/* Messages */}
        {activeConversation && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages[activeConversation.id] &&
            messages[activeConversation.id].length ? (
              messages[activeConversation.id].map((msg, idx) => (
                <div key={idx}>
                  <div className="font-medium text-gray-700">
                    {msg.from?.name || "Unknown"}{" "}
                    <span className="text-xs text-gray-400 ml-2">
                      {msg.timestamp || msg.created_time}
                    </span>
                  </div>
                  <div className="bg-white border rounded-lg p-3 mt-1 shadow-sm">
                    {msg.text || msg.message}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center">No messages yet</p>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Input */}
        {activeConversation && (
          <div className="border-t bg-white p-3">
            <div className="flex items-center border rounded-lg overflow-hidden">
              <input
                type="text"
                placeholder="Start typing to join"
                className="flex-1 px-3 py-2 outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.target.value.trim()) {
                    // sendMessage(e.target.value.trim());
                    e.target.value = "";
                  }
                }}
              />
              <button className="px-4 py-2 bg-purple-600 text-white font-semibold">
                Reply
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

