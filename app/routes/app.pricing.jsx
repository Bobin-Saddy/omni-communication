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
  const { authenticate, MONTHLY_PLAN, PRO_MONTHLY_PLAN } = await import("../shopify.server");
  const { billing } = await authenticate.admin(request);

  try {
    const billingCheck = await billing.require({
      plans: [MONTHLY_PLAN, PRO_MONTHLY_PLAN],
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
        {plan.name === "Monthly subscription" || plan.name === "Pro Monthly subscription" ? (
          <p>You're currently on Pro plan. All features are unlocked.</p>
        ) : (
          <p>You're currently on Free plan. Upgrade to Pro to unlock more features.</p>
        )}
      </CalloutCard>

      <div style={{ margin: "1.5rem 0" }}>
        <Divider />
      </div>

<Grid columns={{ xs: 1, sm: 2, md: 2, lg: 2, xl: 2 }} gap="400">
  {planData.map((plan_item, index) => (
    <Grid.Cell key={index}>
      <Card
        sectioned
        padding="400"
        style={{
          backgroundColor: "#f9fafb", // subtle gray background
          borderRadius: "12px",
          boxShadow: plan_item.name === plan.name
            ? "0 0 0 3px #31b76a" // highlight current plan
            : "0 2px 10px rgba(0,0,0,0.08)",
          textAlign: "center",
        }}
      >
        <Box>
          <Text as="h3" variant="headingLg" fontWeight="bold">
            {plan_item.title}
          </Text>
          <Text as="p" variant="bodyMd" color="subdued">
            {plan_item.description}
          </Text>

          <Box paddingBlockStart="300" paddingBlockEnd="300">
            <Text as="p" variant="heading2xl" fontWeight="bold" color="critical">
              {`$${plan_item.price}/mo`}
            </Text>
          </Box>

          <ul style={{
            margin: "0 auto 1rem",
            paddingLeft: "1.2rem",
            maxWidth: "300px",
            textAlign: "left",
            listStyle: "disc",
            color: "#333",
          }}>
            {plan_item.features.map((feature, i) => (
              <li key={i} style={{ marginBottom: "0.35rem", fontSize: "0.9rem" }}>
                {feature}
              </li>
            ))}
          </ul>

          {plan_item.name !== plan.name ? (
            <Button primary size="large" url={plan_item.url}>
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
