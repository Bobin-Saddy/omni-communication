import { redirect } from "@remix-run/node";
import { authenticate, MONTHLY_PLAN, PRO_MONTHLY_PLAN, FREE_PLAN } from "../shopify.server";

export const loader = async ({ request }) => {
  const { billing, session } = await authenticate.admin(request);
  const { shop } = session;
  const myShop = shop.replace(".myshopify.com", "");

  const url = new URL(request.url);
  const selectedPlan = url.searchParams.get("plan");

  let planToUse;

  // ✅ Handle plan selection
  if (selectedPlan === "free") {
    // Handle Free Plan internally without billing request
    // Example: save free plan status in DB if needed
    console.log(`User ${shop} selected Free Plan`);
    return redirect("/app/pricing");
  } else if (selectedPlan === "monthly") {
    planToUse = MONTHLY_PLAN;
  } else if (selectedPlan === "pro_monthly") {
    planToUse = PRO_MONTHLY_PLAN;
  } else {
    throw new Error("Invalid plan selected");
  }

  // ✅ Require billing for selected paid plan
  await billing.require({
    plans: [planToUse],
    isTest: true,
    onFailure: async () =>
      billing.request({
        plan: planToUse,
        isTest: true,
        returnUrl: `https://admin.shopify.com/store/${myShop}/apps/omni-communication/app/pricing`,
      }),
  });

  return redirect("/app/pricing");
};
