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
  const days = Number(searchParams.get("days") ?? "180");

  const end = new Date();
  const start = new Date(end.getTime() - (days - 1) * DAY_MS);

  const startIso = start.toISOString();
  const endIso = end.toISOString();

  // WHOOP v2 recovery endpoint (you may need to tweak based on exact API docs)
  const recoveryUrl = new URL(
    "https://api.prod.whoop.com/developer/v2/recovery"
  );
  recoveryUrl.searchParams.set("start", startIso);
  recoveryUrl.searchParams.set("end", endIso);
  recoveryUrl.searchParams.set("limit", "25");

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

  const [recoveryRes, sleepRes, cycleRes] = await Promise.all([
    fetch(recoveryUrl.toString(), { headers }),
    fetch(sleepUrl.toString(), { headers }),
    fetch(cycleUrl.toString(), { headers }),
  ]);

  const [recoveryRaw, sleepRaw, cycleRaw] = await Promise.all([
    recoveryRes.text(),
    sleepRes.text(),
    cycleRes.text(),
  ]);

  let recoveryJson: any = null;
  let sleepJson: any = null;
  let cycleJson: any = null;

  try {
    recoveryJson = JSON.parse(recoveryRaw);
  } catch {}
  try {
    sleepJson = JSON.parse(sleepRaw);
  } catch {}
  try {
    cycleJson = JSON.parse(cycleRaw);
  } catch {}

  if (!recoveryRes.ok) {
    console.error("WHOOP recovery error:", recoveryRes.status, recoveryRaw);
  }
  if (!sleepRes.ok) {
    console.error("WHOOP sleep error:", sleepRes.status, sleepRaw);
  }
  if (!cycleRes.ok) {
    console.error("WHOOP cycle error:", cycleRes.status, cycleRaw);
  }

  // Basic defensive check
  const recoveryRecords: any[] = recoveryJson?.records ?? [];
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

  // Recovery: assume record has something like { score: { recovery_score_percentage }, timestamp }
  for (const r of recoveryRecords) {
    const ts = r?.timestamp || r?.created_at || r?.start;
    if (!ts) continue;
    const dateKey = ts.slice(0, 10);
    const m = upsert(dateKey);
    const pct =
      r?.score?.recovery_score_percentage ??
      r?.recovery_score_percentage ??
      r?.score ??
      null;
    if (typeof pct === "number") {
      m.recovery = pct;
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
