import { DailyMetrics } from "./types";

export function band(value: number | null, metric: "recovery" | "sleepPerformance" | "strain") {
  if (value === null || Number.isNaN(value)) return "none" as const;
  if (metric === "strain") {
    if (value <= 9) return "red" as const;
    if (value <= 14) return "yellow" as const;
    return "green" as const;
  }
  if (value <= 33) return "red" as const;
  if (value <= 66) return "yellow" as const;
  return "green" as const;
}

export const BAND_COLOR: Record<"red" | "yellow" | "green" | "none", string> = {
  red: "#cf6b4e",
  yellow: "#dfb055",
  green: "#6f9e84",
  none: "#ece9e4",
};

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function nonNull(data: DailyMetrics[], key: "recovery" | "sleepPerformance" | "strain" | "sleepHours") {
  return data.map((d) => d[key]).filter((v): v is number => typeof v === "number");
}

function longestRun(data: DailyMetrics[], predicate: (d: DailyMetrics) => boolean) {
  let best = 0;
  let current = 0;
  for (const d of data) {
    if (predicate(d)) {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 0;
    }
  }
  return best;
}

type RunRange = { length: number; start: string | null; end: string | null };

function longestRunWithRange(
  data: DailyMetrics[],
  predicate: (d: DailyMetrics) => boolean
): RunRange {
  let best: RunRange = { length: 0, start: null, end: null };
  let currentLength = 0;
  let currentStart: string | null = null;

  for (const d of data) {
    if (predicate(d)) {
      if (currentLength === 0) currentStart = d.date;
      currentLength += 1;
      if (currentLength > best.length) {
        best = { length: currentLength, start: currentStart, end: d.date };
      }
    } else {
      currentLength = 0;
      currentStart = null;
    }
  }

  return best;
}

function trailingRun(data: DailyMetrics[], predicate: (d: DailyMetrics) => boolean) {
  let count = 0;
  for (let i = data.length - 1; i >= 0; i--) {
    if (predicate(data[i])) count += 1;
    else break;
  }
  return count;
}

export function computeStats(data: DailyMetrics[]) {
  const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));

  const avgRecovery = mean(nonNull(sorted, "recovery"));
  const avgSleepPerformance = mean(nonNull(sorted, "sleepPerformance"));
  const avgSleepHours = mean(nonNull(sorted, "sleepHours"));
  const avgStrain = mean(nonNull(sorted, "strain"));

  const currentStreak = trailingRun(
    sorted,
    (d) => band(d.recovery, "recovery") === "green"
  );

  const loggedDays = sorted.filter(
    (d) => d.recovery !== null || d.sleepPerformance !== null || d.strain !== null
  ).length;

  const greenDays = sorted.filter((d) => band(d.recovery, "recovery") === "green").length;

  const longestGreenStrainRunRange = longestRunWithRange(
    sorted,
    (d) => band(d.strain, "strain") !== "red" && d.strain !== null && d.strain > 14
  );
  const longestGreenStrainRun = longestGreenStrainRunRange.length;

  const longestSleepDebtFreeRun = longestRun(
    sorted,
    (d) => typeof d.sleepHours === "number" && d.sleepHours >= 6
  );

  const longestNoRedRecoveryRun = longestRun(
    sorted,
    (d) => d.recovery !== null && band(d.recovery, "recovery") !== "red"
  );

  const longestGreenRecoveryRun = longestRun(
    sorted,
    (d) => band(d.recovery, "recovery") === "green"
  );

  const streakDots = sorted.slice(-14).map((d) => ({
    bg: BAND_COLOR[band(d.recovery, "recovery")],
  }));

  const bestWeekday = (() => {
    const sums = new Map<number, { total: number; count: number }>();
    for (const d of sorted) {
      if (d.recovery === null) continue;
      const weekday = new Date(d.date + "T00:00:00").getDay();
      const entry = sums.get(weekday) ?? { total: 0, count: 0 };
      entry.total += d.recovery;
      entry.count += 1;
      sums.set(weekday, entry);
    }
    let best: { weekday: number; avg: number } | null = null;
    for (const [weekday, { total, count }] of sums) {
      const avg = total / count;
      if (!best || avg > best.avg) best = { weekday, avg };
    }
    return best;
  })();

  const nightsUnderSix = sorted.filter(
    (d) => typeof d.sleepHours === "number" && d.sleepHours < 6
  ).length;

  const redRecoveryDays = sorted.filter(
    (d) => band(d.recovery, "recovery") === "red"
  ).length;

  return {
    avgRecovery,
    avgSleepPerformance,
    avgSleepHours,
    avgStrain,
    currentStreak,
    loggedDays,
    greenDays,
    longestGreenStrainRun,
    longestGreenStrainRunRange,
    longestGreenRecoveryRun,
    longestSleepDebtFreeRun,
    longestNoRedRecoveryRun,
    streakDots,
    bestWeekday,
    nightsUnderSix,
    redRecoveryDays,
  };
}

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export function weekdayName(i: number) {
  return WEEKDAY_NAMES[i] ?? "";
}

export function computeReadoutInputs(data: DailyMetrics[]) {
  const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));
  const last30 = sorted.slice(-30);
  // Split the same 30-day window in half for the trend comparison, rather
  // than reaching back 42 days total — keeps this genuinely within the "30
  // days of four metrics" the Insights panel says it reads.
  const last15 = sorted.slice(-15);
  const prev15 = sorted.slice(-30, -15);

  const nightsUnderSix = last30.filter(
    (d) => typeof d.sleepHours === "number" && d.sleepHours < 6
  ).length;

  const redRecoveryDays = last30.filter(
    (d) => band(d.recovery, "recovery") === "red"
  ).length;

  const recoveryTrend =
    (mean(nonNull(last15, "recovery")) ?? 0) -
    (mean(nonNull(prev15, "recovery")) ?? 0);

  const strainTrend =
    (mean(nonNull(last15, "strain")) ?? 0) -
    (mean(nonNull(prev15, "strain")) ?? 0);

  const stats = computeStats(sorted);

  return {
    nightsUnderSix,
    redRecoveryDays,
    recoveryTrend: Math.round(recoveryTrend),
    strainTrend: Math.round(strainTrend * 10) / 10,
    avgRecovery: stats.avgRecovery !== null ? Math.round(stats.avgRecovery) : null,
    avgStrain: stats.avgStrain !== null ? Math.round(stats.avgStrain * 10) / 10 : null,
    avgSleepHours:
      stats.avgSleepHours !== null ? Math.round(stats.avgSleepHours * 10) / 10 : null,
    currentStreak: stats.currentStreak,
    bestWeekday: stats.bestWeekday
      ? { day: weekdayName(stats.bestWeekday.weekday), avg: Math.round(stats.bestWeekday.avg) }
      : null,
  };
}
