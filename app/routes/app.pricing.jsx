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
    title: "Essential",
    description: "Essential plan with basic features",
    price: "14.99",
    name: "Essential subscription",
    action: "Start 7-day FREE trial",
    url: "/app/upgrade?plan=essential",
    features: [
      "Unlimited number of offers",
      "Available on home and product page",
      "Progressive gifts",
      "7/7 Customer Service",
      "Upsell offers",
      "From $500.00 to $2,000.00 in monthly sales",
    ]
  },
  {
    title: "Pro",
    description: "Pro plan with advanced features",
    price: "29.99",
    name: "Pro subscription",
    action: "Start 7-day FREE trial",
    url: "/app/upgrade?plan=pro",
    features: [
      "Unlimited number of offers",
      "Available on home and product page",
      "Progressive gifts",
      "7/7 Customer Service",
      "Upsell offers",
      "From $2,000.00 to $10,000.00 in monthly sales",
    ]
  },
  {
    title: "Premium",
    description: "Premium plan with full features",
    price: "59.99",
    name: "Premium subscription",
    action: "Start 7-day FREE trial",
    url: "/app/upgrade?plan=premium",
    features: [
      "Unlimited number of offers",
      "Available on home and product page",
      "Progressive gifts",
      "7/7 Customer Service",
      "Upsell offers",
      "Over $10,000.00 sales per month",
    ]
  },
];

export default function PricingPage() {
  const { plan } = useLoaderData();

  return (
    <Page title="Upgrade your Plan and take your business to the Moon...">
      <CalloutCard
        title="Change your plan"
        illustration="https://cdn.shopify.com/s/files/1/0583/6465/7734/files/tag.png?v=1705280535"
        primaryAction={{
          content: 'Cancel Plan',
          url: '/app/cancel',
        }}
      >
        {plan.name !== "Free" ? (
          <p>You're currently on {plan.name}. All features are unlocked.</p>
        ) : (
          <p>You're currently on Free plan. Upgrade to unlock more features.</p>
        )}
      </CalloutCard>

      <div style={{ margin: "0.5rem 0" }}>
        <Divider />
      </div>

      <Grid>
        {planData.map((plan_item, index) => (
          <Grid.Cell key={index} columnSpan={{ xs: 6, sm: 3, md: 3, lg: 4, xl: 4 }}>
            <Card
              title={plan_item.title}
              sectioned
            >
              <Box padding="400">
                <Text variant="headingLg" as="p" fontWeight="bold">
                  ${plan_item.price} / month
                </Text>
                <Box as="p" variant="bodyMd">{plan_item.description}</Box>

                <div style={{ marginTop: "1rem" }}>
                  {plan_item.features.map((feature, i) => (
                    <Text key={i} as="p" variant="bodySm">• {feature}</Text>
                  ))}
                </div>

                <div style={{ marginTop: "1rem" }}>
                  {plan_item.name !== plan.name ? (
                    <Button primary url={plan_item.url}>
                      {plan_item.action}
                    </Button>
                  ) : (
                    <Text as="p" variant="bodyMd" fontWeight="medium" tone="success">
                      You're currently on this plan
                    </Text>
                  )}
                </div>
              </Box>
            </Card>
          </Grid.Cell>
        ))}
      </Grid>
    </Page>
  );
}
