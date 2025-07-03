import { redirect } from "@remix-run/node";
import { authenticate, MONTHLY_PLAN, PRO_MONTHLY_PLAN, FREE_PLAN } from "../shopify.server";

export const loader = async ({ request }) => {
  const { billing } = await authenticate.admin(request);
  const billingCheck = await billing.require({
    plans: [MONTHLY_PLAN, PRO_MONTHLY_PLAN, FREE_PLAN],
    onFailure: async () => billing.request({ plan: FREE_PLAN }),
  });

  const subscription = billingCheck.appSubscriptions[0];
  const cancelledSubscription = await billing.cancel({
    subscriptionId: subscription.id,
    isTest: true,
    prorate: true,
  });

  return redirect("/app/pricing");
};
