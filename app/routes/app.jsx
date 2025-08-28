import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { GlobalProvider } from "./AppContext";

// If you want Polaris styling, uncomment this:
// import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
// export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }) => {
  // 🔒 authenticate shopify admin before rendering
  await authenticate.admin(request);
  return { apiKey: process.env.SHOPIFY_API_KEY || "" };
};

export default function App() {
  const { apiKey } = useLoaderData();

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <GlobalProvider>
        {/* Shopify App Bridge navigation */}
        <NavMenu>
          <Link to="/app" rel="home">Home</Link>
          <Link to="/app/settings">Settings</Link>
          {/* Add more nav links if needed */}
        </NavMenu>

        {/* ✅ this is where your child routes (like dashboard) render */}
        <Outlet />
      </GlobalProvider>
    </AppProvider>
  );
}

// Shopify requires this error boundary
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => boundary.headers(headersArgs);
