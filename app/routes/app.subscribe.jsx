// app/routes/subscribe.jsx
import { json, redirect } from "@remix-run/node";
import { prisma } from "../db.server"; // your prisma client
import { getSession } from "./app.sessions"; // your session utility

export const action = async ({ request }) => {
  const session = await getSession(request.headers.get("Cookie"));
  const currentSessionId = session.get("sessionId"); // Assuming you store 'sessionId' in your session

  if (!currentSessionId) {
    return json({ error: "Session ID not found" }, { status: 400 });
  }

  // Fetch shop details from Session table in DB
  const shopData = await prisma.session.findUnique({
    where: { id: currentSessionId },
  });

  if (!shopData) {
    return json({ error: "Shop session not found in database" }, { status: 400 });
  }

  const { shop, accessToken } = shopData;

  const formData = await request.formData();
  const plan = formData.get("plan"); // 'basic', 'annual', 'premium'

  let price, name, interval;
  switch (plan) {
    case "basic":
      price = 10.0;
      name = "Basic Plan";
      interval = "every_30_days";
      break;
    case "annual":
      price = 20.0;
      name = "Annual Plan";
      interval = "every_365_days";
      break;
    case "premium":
      price = 30.0;
      name = "Premium Plan";
      interval = "every_30_days";
      break;
    default:
      return json({ error: "Invalid plan" }, { status: 400 });
  }

  // Create Recurring Application Charge via Shopify API
  const response = await fetch(
    `https://${shop}/admin/api/2023-04/recurring_application_charges.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken, // Use token from Session model
      },
      body: JSON.stringify({
        recurring_application_charge: {
          name,
          price,
          return_url: `https://omni-communication-6edad6c27b71.herokuapp.com/subscribe/callback?shop=${shop}`,
          trial_days: 3,
          test: true, // remove in production
          interval,
        },
      }),
    }
  );

  const data = await response.json();
  const confirmationUrl = data.recurring_application_charge.confirmation_url;

  return redirect(confirmationUrl);
};

export const loader = async ({ request }) => {
  const session = await getSession(request.headers.get("Cookie"));
  const currentSessionId = session.get("sessionId");

  if (!currentSessionId) {
    return json({ error: "Session ID not found" }, { status: 400 });
  }

  const shopData = await prisma.session.findUnique({
    where: { id: currentSessionId },
  });

  return json({ shop: shopData?.shop });
};

export default function Subscribe() {
  return (
    <div className="p-10">
      <h1 className="text-2xl mb-4">Choose a Subscription Plan</h1>
      <form method="post">
        <button
          type="submit"
          name="plan"
          value="basic"
          className="bg-blue-600 text-white px-4 py-2 m-2 rounded"
        >
          Basic Plan ($10/month)
        </button>
        <button
          type="submit"
          name="plan"
          value="annual"
          className="bg-green-600 text-white px-4 py-2 m-2 rounded"
        >
          Annual Plan ($20/year)
        </button>
        <button
          type="submit"
          name="plan"
          value="premium"
          className="bg-purple-600 text-white px-4 py-2 m-2 rounded"
        >
          Premium Plan ($30/month)
        </button>
      </form>
    </div>
  );
}
