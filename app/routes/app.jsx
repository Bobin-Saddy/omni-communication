import {
  Outlet,
  useLoaderData,
  useLocation,
} from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { authenticate } from "../shopify.server";
import { PersistentLink } from "./components/PersistentLink";
import { Suspense } from "react";

// Include Polaris styles
export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

// 🔒 Loader with error handling
export const loader = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // ✅ Skip authentication on pricing or settings page
    if (pathname === "/app/pricing" || pathname === "/app/settings") {
      return {
        apiKey: process.env.SHOPIFY_API_KEY || "",
        shop: url.searchParams.get("shop") || "", // get shop from URL query
      };
    }

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
  const location = useLocation(); // ✅ get current path

  // ✅ Paths where shop param is optional
  const skipSpinnerPaths = ["/app/pricing", "/app/settings"];
  const isSkipPath = skipSpinnerPaths.includes(location.pathname);

  if (!apiKey || (!shop && !isSkipPath)) {
    return isSkipPath ? <Outlet /> : <div>Missing shop or API key</div>;
  }

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey} shopOrigin={shop}>
      <NavMenu>
        <PersistentLink to="/app/additional">Additional</PersistentLink>
        <PersistentLink to="/app/index">Facebook</PersistentLink>
        <PersistentLink to="/app/pricing">Plans</PersistentLink>
        <PersistentLink to="/app/settings">Settings</PersistentLink>
      </NavMenu>

      <Suspense fallback={null}>
        <Outlet />
      </Suspense>
    </AppProvider>
  );
}

// ✅ Error boundary without spinner
export function ErrorBoundary() {
  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <p>Something went wrong.</p>
    </div>
  );
}

// ✅ Pass Shopify-required headers
export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
