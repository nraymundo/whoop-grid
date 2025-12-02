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

  // normalize day boundaries
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  const startIso = start.toISOString();
  const endIso = end.toISOString();

  async function fetchAllPaginated(
    baseUrl: string,
    headers: Record<string, string>,
    label: string,
    maxPages = 10
  ) {
    let all: any[] = [];
    let page = 0;
    let nextToken: string | undefined;

    while (page < maxPages) {
      const url = new URL(baseUrl);

      if (nextToken) {
        // WHOOP expects nextToken as the query param
        url.searchParams.set("nextToken", nextToken);
      }

      const response = await fetch(url.toString(), { headers });
      const raw = await response.text();

      let json: any;
      try {
        json = JSON.parse(raw);
      } catch {
        console.error(`[${label}] non-JSON`, response.status, raw);
        break;
      }

      if (!response.ok) {
        console.error(`[${label}] page error`, response.status, json);
        break;
      }

      const records = json.records ?? [];
      const newToken: string | undefined = json.next_token ?? undefined;

      all = all.concat(records);

      if (!newToken || newToken === nextToken) {
        break;
      }

      nextToken = newToken;
      page += 1;
    }

    return all;
  }

  // --- Build URLs for all three endpoints ---
  const recoveryBaseUrl =
    `https://api.prod.whoop.com/developer/v2/recovery` +
    `?start=${encodeURIComponent(startIso)}` +
    `&end=${encodeURIComponent(endIso)}` +
    `&limit=25`;

  const sleepBaseUrl =
    `https://api.prod.whoop.com/developer/v2/activity/sleep` +
    `?start=${encodeURIComponent(startIso)}` +
    `&end=${encodeURIComponent(endIso)}` +
    `&limit=25`;

  const cycleBaseUrl =
    `https://api.prod.whoop.com/developer/v2/cycle` +
    `?start=${encodeURIComponent(startIso)}` +
    `&end=${encodeURIComponent(endIso)}` +
    `&limit=25`;

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/json",
  };

  // one helper, three endpoints (recovery, sleep, strain)
  const [recoveryRecords, sleepRecords, cycleRecords] = await Promise.all([
    fetchAllPaginated(recoveryBaseUrl, headers, "recovery"),
    fetchAllPaginated(sleepBaseUrl, headers, "sleep"),
    fetchAllPaginated(cycleBaseUrl, headers, "cycle"),
  ]);

  if (cycleRecords.length) {
    console.log(cycleRecords[0]);
    const starts = cycleRecords
      .map((cycle) => cycle.start)
      .filter(Boolean)
      .map((t: string) => new Date(t).toISOString())
      .sort();
  }

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

  // Recovery
  for (const recovery of recoveryRecords) {
    const timestamp = recovery.created_at;
    if (!timestamp) continue;
    const dateKey = timestamp.slice(0, 10);
    const metric = upsert(dateKey);
    const score = recovery.score?.recovery_score ?? null;
    if (typeof score === "number") {
      metric.recovery = score;
    }
  }

  // Sleep
  for (const sleep of sleepRecords) {
    const start = sleep?.start;
    if (!start) continue;
    const dateKey = start.slice(0, 10);
    const metric = upsert(dateKey);

    const performance = sleep?.score?.sleep_performance_percentage ?? null;
    const duration =
      sleep?.score?.stage_summary?.total_in_bed_time_milli -
        sleep?.score?.stage_summary?.total_awake_time_milli || null;

    if (typeof performance === "number") {
      metric.sleepPerformance = performance;
    }
    if (typeof duration === "number") {
      metric.sleepHours = duration / 3600;
    }
  }

  // Cycle (strain)
  for (const cycle of cycleRecords) {
    const start = cycle?.start;
    if (!start) continue;
    const dateKey = start.slice(0, 10);
    const metric = upsert(dateKey);

    const strain = cycle?.score?.strain ?? null;
    if (typeof strain === "number") {
      metric.strain = strain;
    }
  }

  // Build full daily series for the range so heatmap looks continuous
  const daily: DailyMetrics[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    const key = cursor.toISOString().slice(0, 10);
    const metric = byDate.get(key) ?? {
      date: key,
      recovery: null,
      sleepPerformance: null,
      strain: null,
      sleepHours: null,
    };
    daily.push(metric);
    cursor.setDate(cursor.getDate() + 1);
  }

  return NextResponse.json(daily);
}
