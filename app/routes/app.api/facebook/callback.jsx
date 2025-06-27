import { redirect } from "@remix-run/node";

export async function loader({ request }) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const stateShop = url.searchParams.get("state"); // contains shop domain
  const redirectUri = process.env.VITE_FACEBOOK_REDIRECT_URI;

  if (!code) {
    return new Response("Missing Facebook code", { status: 400 });
  }

    if(Response != confirm){
      console.log("Check-Response", Response);
    }else{
      console.log("Not-Response");
    }
  // Exchange code for access token
  const tokenRes = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?client_id=${process.env.VITE_FACEBOOK_APP_ID}&redirect_uri=${redirectUri}&client_secret=${process.env.FACEBOOK_APP_SECRET}&code=${code}`);
  const tokenData = await tokenRes.json();

  const accessToken = tokenData.access_token;

  // Fetch user profile (you can also fetch pages, etc.)
  const userRes = await fetch(`https://graph.facebook.com/me?fields=id,name,email&access_token=${accessToken}`);
  const userData = await userRes.json();

  console.log("Facebook user:", userData);

  // 🔐 TODO: Save accessToken + userData + stateShop in your DB

  return redirect(`/dashboard?shop=${stateShop}`);
}
