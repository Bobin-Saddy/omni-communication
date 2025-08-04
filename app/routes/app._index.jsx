import { useEffect } from "react";
import { Page, Card, Button } from "@shopify/polaris";
import {
  initFacebookSDK,
  handleFacebookLogin,
  handleInstagramLogin,
} from "./app.fbcode";

export default function SocialConnectButtons() {
  useEffect(() => {
    initFacebookSDK();
  }, []);

  const onFacebookLogin = () => {
    handleFacebookLogin((accessToken) => {
      console.log("Facebook access token:", accessToken);
      // Optional: Call your fetchPages logic here
    });
  };

  const onInstagramLogin = () => {
    handleInstagramLogin((accessToken) => {
      console.log("Instagram access token:", accessToken);
      // Optional: Call your fetchInstagramPages logic here
    });
  };

  return (
    <Page title="🔗 Connect Social Media">
      <Card sectioned>
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "20px", padding: "50px 0" }}>
          <Button onClick={onFacebookLogin} primary size="large">
            Connect with Facebook
          </Button>
          <Button onClick={onInstagramLogin} primary size="large">
            Connect with Instagram
          </Button>
        </div>
      </Card>
    </Page>
  );
}
