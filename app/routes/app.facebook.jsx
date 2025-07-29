import React, { useEffect, useState } from "react";
import { Card, TextField, Button, ResourceList, ResourceItem, Text, Spinner } from "@shopify/polaris";

export default function FacebookChatComponent({ selectedPage, pageAccessTokens }) {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedPage) {
      fetchConversations(selectedPage);
    }
  }, [selectedPage]);

  const fetchConversations = async (page) => {
    const pageId = page.id;
    const accessToken = pageAccessTokens[pageId];
    if (!accessToken) return;

    setLoading(true);
    try {
      const res = await fetch(
        `https://graph.facebook.com/v18.0/${pageId}/conversations?fields=participants,senders,message_count,updated_time,platform&access_token=${accessToken}`
      );
      const data = await res.json();
      if (data?.data) {
        setConversations(data.data);
      }
    } catch (err) {
      console.error("Error fetching conversations:", err);
    }
    setLoading(false);
  };

  const fetchMessages = async (conversation) => {
    const pageId = selectedPage.id;
    const accessToken = pageAccessTokens[pageId];
    if (!accessToken) return;

    setSelectedConversation(conversation);
    setLoading(true);

    try {
      const res = await fetch(
        `https://graph.facebook.com/v18.0/${conversation.id}/messages?fields=message,from,to,created_time&access_token=${accessToken}`
      );
      const data = await res.json();
      if (data?.data) {
        setMessages(data.data.reverse());
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    }

    setLoading(false);
  };

  const sendMessage = async () => {
    const pageId = selectedPage.id;
    const accessToken = pageAccessTokens[pageId];
    const threadId = selectedConversation?.id;
    const platform = selectedConversation?.platform;
    let recipientId = null;

    try {
      if (platform === 'instagram') {
        // Instagram doesn't support fetching participants
        const lastMessageRes = await fetch(
          `https://graph.facebook.com/v18.0/${threadId}/messages?access_token=${accessToken}`
        );
        const lastMessagesData = await lastMessageRes.json();
        if (lastMessagesData?.data?.length > 0) {
          const incomingMsg = lastMessagesData.data.find(msg => msg.from?.id !== pageId);
          recipientId = incomingMsg?.from?.id;
        }
      } else {
        const participantsRes = await fetch(
          `https://graph.facebook.com/v18.0/${threadId}/participants?access_token=${accessToken}`
        );
        const participantsData = await participantsRes.json();
        recipientId = participantsData?.data?.find(p => p.id !== pageId)?.id;
      }

      if (!recipientId) {
        console.error("Recipient ID not found.");
        return;
      }

      const messageBody = {
        messaging_type: "RESPONSE",
        recipient: { id: recipientId },
        message: { text: newMessage },
      };

      const res = await fetch(
        `https://graph.facebook.com/v18.0/me/messages?access_token=${accessToken}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(messageBody),
        }
      );

      const data = await res.json();
      if (data.error) {
        console.error("Error sending message:", data.error);
      } else {
        setNewMessage("");
        fetchMessages(selectedConversation);
      }
    } catch (error) {
      console.error("Message sending failed:", error);
    }
  };

  return (
    <Card title="Messenger Chat Manager">
      {loading ? (
        <Spinner accessibilityLabel="Loading" size="large" />
      ) : (
        <>
          <ResourceList
            resourceName={{ singular: "conversation", plural: "conversations" }}
            items={conversations}
            renderItem={(item) => {
              const participants = item.participants?.data?.map((p) => p.name).join(", ");
              return (
                <ResourceItem id={item.id} onClick={() => fetchMessages(item)}>
                  <Text variant="bodyMd" fontWeight="bold">{participants}</Text>
                  <Text variant="bodySm" color="subdued">
                    Updated: {new Date(item.updated_time).toLocaleString()} - Platform: {item.platform}
                  </Text>
                </ResourceItem>
              );
            }}
          />

          {selectedConversation && (
            <Card sectioned title="Messages">
              {messages.map((msg, idx) => (
                <Text key={idx}><strong>{msg.from?.name || "Unknown"}:</strong> {msg.message}</Text>
              ))}
              <TextField
                label="New Message"
                value={newMessage}
                onChange={setNewMessage}
                multiline
                autoComplete="off"
              />
              <Button onClick={sendMessage} primary>Send</Button>
            </Card>
          )}
        </>
      )}
    </Card>
  );
}
