import { NextResponse } from "next/server";

const ACCESS_COOKIE = "whoop_access_token";
const REFRESH_COOKIE = "whoop_refresh_token";
const REFRESH_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

export interface WhoopTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Exchanges a refresh token for a new access token, so the user doesn't have
 * to click "Connect WHOOP" again every time the ~1hr access token expires.
 * Returns null if the refresh token itself is invalid/expired (30 days) —
 * at that point re-authorizing really is required.
 */
export async function refreshWhoopToken(
  refreshToken: string
): Promise<WhoopTokens | null> {
  const clientId = process.env.WHOOP_CLIENT_ID!;
  const clientSecret = process.env.WHOOP_CLIENT_SECRET!;

  const res = await fetch("https://api.prod.whoop.com/oauth/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!res.ok) {
    console.error("[whoopAuth] refresh failed", res.status, await res.text());
    return null;
  }

  const data = await res.json().catch(() => null);
  if (!data?.access_token) {
    console.error("[whoopAuth] refresh response missing access_token", data);
    return null;
  }

  return {
    accessToken: data.access_token as string,
    // WHOOP rotates refresh tokens on use — fall back to the old one only if
    // a new one wasn't returned.
    refreshToken: (data.refresh_token as string | undefined) ?? refreshToken,
    expiresIn: (data.expires_in as number | undefined) ?? 3600,
  };
}

export function setWhoopCookies(res: NextResponse, tokens: WhoopTokens) {
  res.cookies.set(ACCESS_COOKIE, tokens.accessToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: tokens.expiresIn,
  });
  res.cookies.set(REFRESH_COOKIE, tokens.refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: REFRESH_MAX_AGE,
  });
}
