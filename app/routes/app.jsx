import {
  Outlet,
  useLoaderData,
  useRouteError,
  useNavigation,
} from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { Spinner } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { PersistentLink } from "./components/PersistentLink";
import { Suspense } from "react";

// Include Polaris styles
export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

// 🔒 Loader with error handling
export const loader = async ({ request }) => {
  try {
    const { session, billing } = await authenticate.admin(request);

    const billingCheck = await billing.require({
      plans: ["Monthly subscription", "Pro Monthly subscription"],
      isTest: true,
      onFailure: async () => {
        // Redirect to pricing page if no active plan
        const shop = session.shop.replace(".myshopify.com", "");
        throw redirect(`https://admin.shopify.com/store/${shop}/apps/omni-communication/app/pricing`);
      },
    });

    const activePlan = billingCheck.appSubscriptions[0]?.name || null;

    return {
      apiKey: process.env.SHOPIFY_API_KEY || "",
      shop: session.shop,
      activePlan,
    };
  } catch (error) {
    console.error("Loader error:", error);

    // If the error is a Response (like a redirect), rethrow it
    if (error instanceof Response) {
      throw error;
    }

    throw new Response("Unauthorized", { status: 401 });
  }
};


// ✅ Main app shell
export default function App() {
  const { apiKey, shop, activePlan } = useLoaderData();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";

  if (!apiKey || !shop) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <Spinner accessibilityLabel="Initializing..." size="large" />
      </div>
    );
  }

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey} shopOrigin={shop}>
      <NavMenu>
        {/* Show Pricing link always */}
        <PersistentLink to="/app/pricing">Plan</PersistentLink>

        {/* Show Check-1 only if Monthly subscription */}
        {activePlan === "Monthly subscription" && (
          <PersistentLink to="/app/pagespeed">Check-1</PersistentLink>
        )}

        {/* Show Check-2 only if Pro Monthly subscription */}
        {activePlan === "Pro Monthly subscription" && (
          <PersistentLink to="/app/optimize-images">Check-2</PersistentLink>
        )}
      </NavMenu>

      {isLoading ? (
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <Spinner accessibilityLabel="Loading" size="large" />
        </div>
      ) : (
        <Suspense fallback={<Spinner accessibilityLabel="Loading..." size="large" />}>
          <Outlet />
        </Suspense>
      )}
    </AppProvider>
  );
}

// ✅ Error boundary shows loader instead of error message
export function ErrorBoundary() {
  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <Spinner accessibilityLabel="Loading..." size="large" />
    </div>
  );
}

// ✅ Pass Shopify-required headers
export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
