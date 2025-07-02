// app/routes/subscribe/callback.jsx
import { redirect } from "@remix-run/node";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  const chargeId = url.searchParams.get("charge_id");

  // Activate charge
  const response = await fetch(
    `https://${shop}/admin/api/2023-04/recurring_application_charges/${chargeId}/activate.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": process.env.SHOPIFY_ACCESS_TOKEN,
      },
    }
  );

  const data = await response.json();
  // Save charge info to your DB if needed

  return redirect(`/success?shop=${shop}`);
};

export default function Callback() {
  return <div>Activating subscription...</div>;
}
