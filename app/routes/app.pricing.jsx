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
  const { authenticate, MONTHLY_PLAN, ANNUAL_PLAN } = await import("../shopify.server");
  const { billing } = await authenticate.admin(request);

  try {
    const billingCheck = await billing.require({
      plans: [MONTHLY_PLAN, ANNUAL_PLAN],
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
    title: "Free",
    description: "Free plan with basic features",
    price: "0",
    action: "Upgrade to Pro Monthly",
    name: "Free",
    url: "/app/upgrade?plan=monthly",
    features: [
      "100 wishlist per day",
      "500 Products",
      "Basic customization",
      "Basic support",
      "Basic analytics",
    ],
  },
  {
    title: "Pro Monthly",
    description: "Advanced features with 3 days free trial",
    price: "10",
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
    title: "Pro Annual",
    description: "Annual plan with discount and 3 days free trial",
    price: "100",
    name: "Annual subscription",
    action: "Upgrade to Pro Annual",
    url: "/app/upgrade?plan=annual",
    features: [
      "Unlimited wishlist per day",
      "10000 Products",
      "Advanced customization",
      "Priority support",
      "Advanced analytics",
      "3 days free trial",
      "20% cheaper annually",
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
