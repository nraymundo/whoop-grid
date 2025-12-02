import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.WHOOP_CLIENT_ID!;
  const redirectUri = "http://localhost:3000/api/auth/whoop/callback";

  console.log("WHOOP LOGIN ROUTE HIT");
  console.log("CLIENT ID:", clientId);
  console.log("REDIRECT URI (HARD-CODED):", redirectUri);

  const state =
    Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);

  const authUrl = new URL("https://api.prod.whoop.com/oauth/oauth2/auth");

  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set(
    "scope",
    "offline read:profile read:recovery read:sleep read:workout read:cycles"
  );

  console.log("AUTH URL:", authUrl.toString());

  const res = NextResponse.redirect(authUrl.toString());
  res.cookies.set("whoop_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60,
  });

  return res;
}
