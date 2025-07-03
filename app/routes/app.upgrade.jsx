import { redirect } from "@remix-run/node";
import { authenticate, MONTHLY_PLAN, PRO_MONTHLY_PLAN, FREE_PLAN } from "../shopify.server";

export const loader = async ({ request }) => {
  const { billing, session } = await authenticate.admin(request);
  const { shop } = session;
  const myShop = shop.replace(".myshopify.com", "");

  const url = new URL(request.url);
  const selectedPlan = url.searchParams.get("plan");

  let planToUse;

  if (selectedPlan === "free") {
    // ✅ Handle free plan internally without billing.request
    // For example, update user in DB as free plan user
    // await prisma.user.update({ where: { shop }, data: { plan: FREE_PLAN } });
    console.log(`User ${shop} activated Free Plan`);
    return redirect("/app/pricing");
  }

  // ✅ Map selected plan to constants
  if (selectedPlan === "monthly") {
    planToUse = MONTHLY_PLAN;
  } else if (selectedPlan === "pro_monthly") {
    planToUse = PRO_MONTHLY_PLAN;
  } else {
    throw new Error("Invalid plan selected");
  }

  // ✅ Require billing; if not active, request billing
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
