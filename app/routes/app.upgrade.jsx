import { redirect } from "@remix-run/node";

export const loader = async ({ request }) => {
  const { authenticate, MONTHLY_PLAN, ANNUAL_PLAN, TRIAL_PLAN } = await import("../shopify.server");

  const { billing, session } = await authenticate.admin(request);
  let { shop } = session;
  let myShop = shop.replace(".myshopify.com", "");

  const url = new URL(request.url);
  const selectedPlan = url.searchParams.get("plan");

  let planToUse;
  if (selectedPlan === "annual") planToUse = ANNUAL_PLAN;
  else if (selectedPlan === "trial") planToUse = TRIAL_PLAN;
  else planToUse = MONTHLY_PLAN;

  await billing.require({
    plans: [planToUse],
    onFailure: async () => billing.request({
      plan: planToUse,
      isTest: true,
      returnUrl: `https://admin.shopify.com/store/${myShop}/apps/omni-communication/app/pricing`,
    }),
  });

  return redirect("/app/pricing");
};
