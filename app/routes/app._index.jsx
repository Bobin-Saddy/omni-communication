// File: SocialChatDashboard.jsx

import { useState, useEffect } from "react";
import {
  Page,
  Card,
  Button,
  Text,
  Layout,
  TextContainer,
  Stack,
} from "@shopify/polaris";

export default function SocialChatDashboard() {
  const [fbConnected, setFbConnected] = useState(false);
  const [igConnected, setIgConnected] = useState(false);
  const [waConnected, setWaConnected] = useState(false);
  const [fbPages, setFbPages] = useState([]);
  const [igPages, setIgPages] = useState([]);
  const [fbChats, setFbChats] = useState([]);
  const [igChats, setIgChats] = useState([]);
  const [waMessage, setWaMessage] = useState("");
  const [waResponse, setWaResponse] = useState("");

  // Dummy tokens – replace these with your actual access token and IDs
  const ACCESS_TOKEN = "YOUR_LONG_LIVED_ACCESS_TOKEN";
  const WHATSAPP_PHONE_ID = "106660072463312";
  const WHATSAPP_RECIPIENT_NUMBER = "919463955268"; // Without '+' sign
  const WHATSAPP_URL = `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_ID}/messages`;

  // Fetch Facebook Pages
  const fetchFacebookPages = async () => {
    const res = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${ACCESS_TOKEN}`
    );
    const data = await res.json();
    setFbPages(data.data || []);
    setFbConnected(true);
  };

  // Fetch Instagram Accounts (linked to FB Pages)
  const fetchInstagramAccounts = async () => {
    const promises = fbPages.map(async (page) => {
      const res = await fetch(
        `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${ACCESS_TOKEN}`
      );
      const data = await res.json();
      if (data.instagram_business_account) {
        return {
          page: page.name,
          ig_id: data.instagram_business_account.id,
        };
      }
    });

    const results = await Promise.all(promises);
    const filtered = results.filter(Boolean);
    setIgPages(filtered);
    setIgConnected(true);
  };

  // Send WhatsApp Message
  const sendWhatsAppMessage = async () => {
    const payload = {
      messaging_product: "whatsapp",
      to: WHATSAPP_RECIPIENT_NUMBER,
      type: "text",
      text: { body: waMessage },
    };

    const res = await fetch(WHATSAPP_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    setWaResponse(JSON.stringify(data, null, 2));
  };

  // Fetch FB Conversations
  const fetchFbConversations = async () => {
    if (!fbPages.length) return;
    const page = fbPages[0];
    const res = await fetch(
      `https://graph.facebook.com/v18.0/${page.id}/conversations?access_token=${ACCESS_TOKEN}`
    );
    const data = await res.json();
    setFbChats(data.data || []);
  };

  // Fetch IG Conversations
  const fetchIgConversations = async () => {
    if (!igPages.length) return;
    const ig = igPages[0];
    const res = await fetch(
      `https://graph.facebook.com/v18.0/${ig.ig_id}/conversations?access_token=${ACCESS_TOKEN}`
    );
    const data = await res.json();
    setIgChats(data.data || []);
  };

  return (
    <Page title="Social Chat Dashboard">
      <Layout>
        {/* Facebook Integration */}
        <Layout.Section>
          <Card title="Facebook Integration" sectioned>
            <Stack vertical>
              <Button onClick={fetchFacebookPages}>
                {fbConnected ? "Refresh Facebook Pages" : "Connect Facebook"}
              </Button>

              {fbPages.length > 0 && (
                <>
                  <Text variant="headingMd">Connected Pages:</Text>
                  <ul>
                    {fbPages.map((page) => (
                      <li key={page.id}>
                        <Text>{page.name}</Text>
                      </li>
                    ))}
                  </ul>
                  <Button onClick={fetchFbConversations}>Load FB Chats</Button>
                  {fbChats.length > 0 && (
                    <TextContainer>
                      <Text variant="headingSm">FB Conversations:</Text>
                      <ul>
                        {fbChats.map((chat) => (
                          <li key={chat.id}>{chat.id}</li>
                        ))}
                      </ul>
                    </TextContainer>
                  )}
                </>
              )}
            </Stack>
          </Card>
        </Layout.Section>

        {/* Instagram Integration */}
        <Layout.Section>
          <Card title="Instagram Integration" sectioned>
            <Stack vertical>
              <Button onClick={fetchInstagramAccounts}>
                {igConnected ? "Refresh Instagram Pages" : "Connect Instagram"}
              </Button>

              {igPages.length > 0 && (
                <>
                  <Text variant="headingMd">Connected IG Accounts:</Text>
                  <ul>
                    {igPages.map((ig) => (
                      <li key={ig.ig_id}>{ig.page}</li>
                    ))}
                  </ul>
                  <Button onClick={fetchIgConversations}>Load IG Chats</Button>
                  {igChats.length > 0 && (
                    <TextContainer>
                      <Text variant="headingSm">IG Conversations:</Text>
                      <ul>
                        {igChats.map((chat) => (
                          <li key={chat.id}>{chat.id}</li>
                        ))}
                      </ul>
                    </TextContainer>
                  )}
                </>
              )}
            </Stack>
          </Card>
        </Layout.Section>

        {/* WhatsApp Integration */}
        <Layout.Section>
          <Card title="WhatsApp Message Sender" sectioned>
            <Stack vertical>
              <textarea
                style={{ padding: "10px", fontSize: "16px", width: "100%" }}
                rows="4"
                placeholder="Type a message to send via WhatsApp"
                value={waMessage}
                onChange={(e) => setWaMessage(e.target.value)}
              />
              <Button onClick={sendWhatsAppMessage}>Send WhatsApp Message</Button>
              {waResponse && (
                <TextContainer>
                  <Text variant="bodySm">Response:</Text>
                  <pre>{waResponse}</pre>
                </TextContainer>
              )}
            </Stack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
