import { Link, useLocation } from "@remix-run/react";

// A robust link component for Shopify apps that preserves essential query parameters
export function PersistentLink({ to, children, ...props }) {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const shop = searchParams.get("shop");
  const host = searchParams.get("host");
  const embedded = searchParams.get("embedded");

  // Collect only valid params
  const queryParams = new URLSearchParams();
  if (shop) queryParams.set("shop", shop);
  if (host) queryParams.set("host", host);
  if (embedded) queryParams.set("embedded", embedded);

  // Combine with existing `to` URL
  const hasQuery = to.includes("?");
  const finalTo = `${to}${hasQuery ? "&" : "?"}${queryParams.toString()}`;

  return (
    <Link to={finalTo} {...props}>
      {children}
    </Link>
  );
}
