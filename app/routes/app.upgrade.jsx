import { redirect } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { billing, session } = await authenticate.admin(request);
  let { shop } = session;
  let myShop = shop.replace(".myshopify.com", "");

  const url = new URL(request.url);
  const selectedPlan = url.searchParams.get("plan");

  // ✅ Define plan constants here instead of importing
  const MONTHLY_PLAN = "Monthly subscription";
  const PRO_MONTHLY_PLAN = "Pro Monthly subscription";

  let planToUse;
  if (selectedPlan === "pro_monthly") planToUse = PRO_MONTHLY_PLAN;
  else planToUse = MONTHLY_PLAN; // default to monthly

  await billing.require({
    plans: [planToUse],
    onFailure: async () =>
      billing.request({
        plan: planToUse,
        isTest: true,
        returnUrl: `https://admin.shopify.com/store/${myShop}/apps/omni-communication/app/pricing`,
      }),
  });

  return redirect("/app/pricing");
};
