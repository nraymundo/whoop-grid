// app/api/whoop/test-fetch/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const accessToken = req.cookies.get("whoop_access_token")?.value;

  if (!accessToken) {
    return NextResponse.json(
      {
        error:
          "No WHOOP access token cookie found. Click 'Connect WHOOP' again to authorize.",
      },
      { status: 401 }
    );
  }

  const url = new URL("https://api.prod.whoop.com/developer/v2/recovery");
  url.searchParams.set("limit", "5");

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  const status = res.status;
  const raw = await res.text();

  let parsed: any = null;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // non-JSON is fine, we'll surface it
  }

  console.log("WHOOP TEST-FETCH RESPONSE STATUS:", status);
  console.log("WHOOP TEST-FETCH RAW BODY:", raw);

  return NextResponse.json({
    status,
    json: parsed,
    raw,
  });
}
