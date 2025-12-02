import { NextRequest, NextResponse } from "next/server";
import { DailyMetrics } from "@/app/lib/types";

const DAY_MS = 24 * 60 * 60 * 1000;

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

  const { searchParams } = new URL(req.url);
  const days = Number(searchParams.get("days") ?? "25");

  const end = new Date();
  const start = new Date(end.getTime() - (days - 1) * DAY_MS);

  const startIso = start.toISOString();
  const endIso = end.toISOString();

  // 🔹 helper to fetch all recovery pages (25 at a time)
  async function fetchAllRecovery(
    baseUrl: string,
    headers: Record<string, string>,
    maxPages = 10
  ) {
    let all: any[] = [];
    let page = 0;
    let nextToken: string | null = null;

    while (page < maxPages) {
      const url = new URL(baseUrl);

      // Dates + limit stay in baseUrl; we only add pagination token
      if (nextToken) {
        // Try both param names in case WHOOP expects one or the other
        url.searchParams.set("nextToken", nextToken);
        url.searchParams.set("next_token", nextToken);
      }

      const res = await fetch(url.toString(), { headers });
      const raw = await res.text();

      let json: any;
      try {
        json = JSON.parse(raw);
      } catch {
        console.error("Recovery non-JSON:", res.status, raw);
        break;
      }

      if (!res.ok) {
        console.error("Recovery page error:", res.status, json);
        break;
      }

      const records = json.records ?? [];
      const newToken: string | undefined =
        json.nextToken ?? json.next_token ?? undefined;

      console.log(
        "[recovery] page",
        page,
        "records:",
        records.length,
        "nextToken:",
        newToken
      );

      all = all.concat(records);

      // Stop if no more pages or token didn't change
      if (!newToken || newToken === nextToken) {
        break;
      }

      nextToken = newToken;
      page += 1;
    }

    return all;
  }

  // 🔹 Build URLs for all three endpoints
  const recoveryBaseUrl =
    `https://api.prod.whoop.com/developer/v2/recovery` +
    `?start=${encodeURIComponent(startIso)}` +
    `&end=${encodeURIComponent(endIso)}` +
    `&limit=25`;

  const sleepUrl = new URL(
    "https://api.prod.whoop.com/developer/v2/activity/sleep"
  );
  sleepUrl.searchParams.set("start", startIso);
  sleepUrl.searchParams.set("end", endIso);
  sleepUrl.searchParams.set("limit", "25");

  const cycleUrl = new URL("https://api.prod.whoop.com/developer/v2/cycle");
  cycleUrl.searchParams.set("start", startIso);
  cycleUrl.searchParams.set("end", endIso);
  cycleUrl.searchParams.set("limit", "25");

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/json",
  };

  // 🔹 Use pagination for recovery, normal fetch for sleep/cycle
  const [recoveryRecords, sleepRes, cycleRes] = await Promise.all([
    fetchAllRecovery(recoveryBaseUrl, headers),
    fetch(sleepUrl.toString(), { headers }),
    fetch(cycleUrl.toString(), { headers }),
  ]);

  const [sleepRaw, cycleRaw] = await Promise.all([
    sleepRes.text(),
    cycleRes.text(),
  ]);

  let sleepJson: any = null;
  let cycleJson: any = null;

  try {
    sleepJson = JSON.parse(sleepRaw);
  } catch {}
  try {
    cycleJson = JSON.parse(cycleRaw);
  } catch {}

  if (!sleepRes.ok) {
    console.error("WHOOP sleep error:", sleepRes.status, sleepRaw);
  }
  if (!cycleRes.ok) {
    console.error("WHOOP cycle error:", cycleRes.status, cycleRaw);
  }

  console.log("recoveryRecords:", recoveryRecords[0]);
  console.log("recoveryRecords:", recoveryRecords[30]);
  console.log("recoveryRecords:", recoveryRecords[50]);

  // Basic defensive check
  const sleepRecords: any[] = sleepJson?.records ?? [];
  const cycleRecords: any[] = cycleJson?.records ?? [];

  // Map WHOOP data into a date → metrics map
  const byDate = new Map<string, DailyMetrics>();

  const upsert = (date: string): DailyMetrics => {
    const existing = byDate.get(date);
    if (existing) return existing;
    const blank: DailyMetrics = {
      date,
      recovery: null,
      sleepPerformance: null,
      strain: null,
      sleepHours: null,
    };
    byDate.set(date, blank);
    return blank;
  };

  // 🔹 Recovery: now uses `recoveryRecords` directly (already paginated)
  for (const recovery of recoveryRecords) {
    const timestamp = recovery.created_at;
    if (!timestamp) continue;
    const dateKey = timestamp.slice(0, 10);
    const m = upsert(dateKey);
    const score = recovery.score?.recovery_score ?? null;
    if (typeof score === "number") {
      m.recovery = score;
    }
  }

  // Sleep: use sleep performance % and hours if available
  for (const s of sleepRecords) {
    const ts = s?.start || s?.timestamp || s?.created_at;
    if (!ts) continue;
    const dateKey = ts.slice(0, 10);
    const m = upsert(dateKey);

    const perf =
      s?.score?.sleep_performance_percentage ??
      s?.sleep_performance_percentage ??
      null;
    const durationSec = s?.score?.sleep_duration || s?.sleep_duration || null;

    if (typeof perf === "number") {
      m.sleepPerformance = perf;
    }
    if (typeof durationSec === "number") {
      m.sleepHours = durationSec / 3600;
    }
  }

  // Cycle: use strain (0–21)
  for (const c of cycleRecords) {
    const ts = c?.start || c?.timestamp || c?.created_at;
    if (!ts) continue;
    const dateKey = ts.slice(0, 10);
    const m = upsert(dateKey);

    const strain = c?.score?.strain ?? c?.strain ?? null;

    if (typeof strain === "number") {
      m.strain = strain;
    }
  }

  // Build full daily series for the range so heatmap looks continuous
  const daily: DailyMetrics[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    const key = cursor.toISOString().slice(0, 10);
    const m = byDate.get(key) ?? {
      date: key,
      recovery: null,
      sleepPerformance: null,
      strain: null,
      sleepHours: null,
    };
    daily.push(m);
    cursor.setDate(cursor.getDate() + 1);
  }

  return NextResponse.json(daily);
}
