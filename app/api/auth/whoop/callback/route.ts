import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl;

  console.log("WHOOP CALLBACK URL:", url.toString());

  const code = url.searchParams.get("code");

  if (!code) {
    return NextResponse.json(
      {
        error: "Missing code in callback",
        rawQuery: url.searchParams.toString(),
      },
      { status: 400 }
    );
  }

  const clientId = process.env.WHOOP_CLIENT_ID!;
  const clientSecret = process.env.WHOOP_CLIENT_SECRET!;
  const redirectUri = process.env.WHOOP_REDIRECT_URI!;

  const tokenResponse = await fetch(
    "https://api.prod.whoop.com/oauth/oauth2/token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    }
  );

  const tokenRaw = await tokenResponse.text();
  let tokenData: any = null;

  try {
    tokenData = JSON.parse(tokenRaw);
  } catch {
    console.error(
      "WHOOP TOKEN NON-JSON RESPONSE:",
      tokenResponse.status,
      tokenRaw
    );
    return NextResponse.json(
      {
        error: "Token response was not JSON",
        status: tokenResponse.status,
        raw: tokenRaw,
      },
      { status: 400 }
    );
  }

  if (!tokenResponse.ok) {
    return NextResponse.json(
      { error: "Token exchange failed", details: tokenData },
      { status: 400 }
    );
  }

  const accessToken = tokenData.access_token as string | undefined;
  const refreshToken = tokenData.refresh_token as string | undefined;
  const expiresIn = tokenData.expires_in as number | undefined;

  if (!accessToken) {
    return NextResponse.json(
      { error: "No access_token in WHOOP response", details: tokenData },
      { status: 400 }
    );
  }

  const response = NextResponse.redirect(new URL("/", req.url));

  response.cookies.set("whoop_access_token", accessToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: expiresIn ?? 60 * 60,
  });

  if (refreshToken) {
    response.cookies.set("whoop_refresh_token", refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });
  }

  return response;
}
