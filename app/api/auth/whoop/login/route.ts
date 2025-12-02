import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.WHOOP_CLIENT_ID!;
  const redirectUri = process.env.WHOOP_REDIRECT_URI!;

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

  const response = NextResponse.redirect(authUrl.toString());
  response.cookies.set("whoop_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60,
  });

  return response;
}
