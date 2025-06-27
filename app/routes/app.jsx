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
    const { session } = await authenticate.admin(request);

    return {
      apiKey: process.env.SHOPIFY_API_KEY || "",
      shop: session.shop,
    };
  } catch (error) {
    console.error("Loader error:", error);
    throw new Response("Unauthorized", { status: 401 });
  }
};

// ✅ Main app shell
export default function App() {
  const { apiKey, shop } = useLoaderData();
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
        <PersistentLink to="/app/additional">Additional</PersistentLink>
        <PersistentLink to="/app/index">Facebook</PersistentLink>
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
