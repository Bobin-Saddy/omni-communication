import { redirect } from "@remix-run/node";

export const action = async ({ request }) => {
  console.log("✅ Facebook user session cleared (implement DB/session clearing here)");
  return redirect("/");
};

export default function Logout() {
  return null;
}
