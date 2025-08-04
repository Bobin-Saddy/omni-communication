import { useState } from "react";
import { Page, Card, Button, Text, Tabs } from "@shopify/polaris";
import FacebookPagesConversations from "./app.facebook";
import InstagramChatProcessor from "./app.instagram";

export default function UnifiedChatManager() {
  const [selectedTab, setSelectedTab] = useState(0);

  const tabs = [
    {
      id: "facebook",
      content: "Facebook Chat",
      accessibilityLabel: "Facebook Chat Tab",
      panelID: "facebook-content",
    },
    {
      id: "instagram",
      content: "Instagram Chat",
      accessibilityLabel: "Instagram Chat Tab",
      panelID: "instagram-content",
    },
  ];

  return (
    <Page title="💬 Unified Chat Manager">
      <Card>
        <Tabs tabs={tabs} selected={selectedTab} onSelect={setSelectedTab}>
          <Card.Section>
            {selectedTab === 0 ? (
              <FacebookPagesConversations />
            ) : (
              <InstagramChatProcessor />
            )}
          </Card.Section>
        </Tabs>
      </Card>
    </Page>
  );
}
