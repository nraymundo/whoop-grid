export type DailyMetrics = {
  date: string; // "YYYY-MM-DD"
  recovery: number | null; // 0–100 (%)
  sleepPerformance: number | null; // 0–100 (%)
  strain: number | null; // 0–21 (WHOOP strain range)
  sleepHours?: number | null; // optional, for tooltips later
};
