import {
  Page,
  Box,
  Button,
  Card,
  CalloutCard,
  Text,
  Grid,
  Divider,
} from "@shopify/polaris";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

export async function loader({ request }) {
  const { authenticate, MONTHLY_PLAN, PRO_MONTHLY_PLAN, FREE_PLAN } = await import("../shopify.server");
  const { billing } = await authenticate.admin(request);

  try {
const billingCheck = await billing.require({
  plans: [MONTHLY_PLAN, PRO_MONTHLY_PLAN, FREE_PLAN],
  isTest: true,
  onFailure: () => {
    throw new Error('No active plan');
  },
});
    const subscription = billingCheck.appSubscriptions[0];
    return json({ billing, plan: subscription });
  } catch (error) {
    if (error.message === 'No active plan') {
      return json({ billing, plan: { name: "Free" } });
    }
    throw error;
  }
}

const planData = [
  {
    title: "Free Plan",
    description: "Try all features for free for 3 days",
    price: "0",
    name: "Free plan",
    action: "Start Free Trial",
    url: "/app/upgrade?plan=free",
    features: [
      "Access limited for 3 days",
      "Basic features",
      "No cost",
    ],
  },
  {
    title: "Pro Monthly",
    description: "Full features with 3 days free trial",
    price: "20",
    name: "Monthly subscription",
    action: "Upgrade to Pro Monthly",
    url: "/app/upgrade?plan=monthly",
    features: [
      "Unlimited wishlist per day",
      "10000 Products",
      "Advanced customization",
      "Priority support",
      "Advanced analytics",
      "3 days free trial",
    ],
  },
  {
    title: "Pro Plus Monthly",
    description: "Advanced plan for power users with 3 days free trial",
    price: "50",
    name: "Pro Monthly subscription",
    action: "Upgrade to Pro Plus Monthly",
    url: "/app/upgrade?plan=pro_monthly",
    features: [
      "All Pro features",
      "Dedicated support",
      "Advanced integrations",
      "3 days free trial",
    ],
  },
];


export default function PricingPage() {
  const { plan } = useLoaderData();

  return (
    <Page title="Pricing Plans">
      <CalloutCard
        title="Change your plan"
        illustration="https://cdn.shopify.com/s/files/1/0583/6465/7734/files/tag.png?v=1705280535"
        primaryAction={{
          content: 'Cancel Plan',
          url: '/app/cancel',
        }}
      >
        {plan.name === "Monthly subscription" || plan.name === "Annual subscription" ? (
          <p>You're currently on Pro plan. All features are unlocked.</p>
        ) : (
          <p>You're currently on Free plan. Upgrade to Pro to unlock more features.</p>
        )}
      </CalloutCard>

      <div style={{ margin: "1rem 0" }}>
        <Divider />
      </div>

      <Grid columns={{ xs: 1, sm: 2, md: 3, lg: 3, xl: 3 }} gap="400">
        {planData.map((plan_item, index) => (
          <Grid.Cell key={index}>
            <Card
              sectioned
              padding="400"
              background={plan_item.name === plan.name ? "bg-surface-success" : "bg-surface"}
            >
              <Box>
                <Text as="h3" variant="headingMd" fontWeight="bold">
                  {plan_item.title}
                </Text>
                <Text as="p" variant="bodyMd" color="subdued">
                  {plan_item.description}
                </Text>
                <Box paddingBlockStart="200" paddingBlockEnd="200">
                  <Text as="p" variant="headingLg" fontWeight="bold">
                    {plan_item.price === "0" ? "Free" : `$${plan_item.price}/mo`}
                  </Text>
                </Box>

                <ul style={{ marginBottom: "1rem", paddingLeft: "1.2rem" }}>
                  {plan_item.features.map((feature, i) => (
                    <li key={i} style={{ marginBottom: "0.25rem", fontSize: "0.9rem" }}>
                      {feature}
                    </li>
                  ))}
                </ul>

                {plan_item.name !== plan.name ? (
                  <Button primary url={plan_item.url}>
                    {plan_item.action}
                  </Button>
                ) : (
                  <Text as="p" variant="bodyMd" color="success">
                    You're currently on this plan
                  </Text>
                )}
              </Box>
            </Card>
          </Grid.Cell>
        ))}
      </Grid>
    </Page>
  );
}
