import { DailyMetrics } from "./types";

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10); // "YYYY-MM-DD"
}

export function generateMockMetrics(days: number = 180): DailyMetrics[] {
  const today = new Date();
  const start = new Date();
  start.setDate(today.getDate() - (days - 1));

  const result: DailyMetrics[] = [];

  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);

    const recoveryBase = 50 + 40 * Math.sin(i / 10);
    const sleepPerfBase = 80 + 15 * Math.cos(i / 13);
    const strainBase = 10 + 5 * Math.sin(i / 7);

    const recovery = clamp(recoveryBase + randomNoise(10), 0, 100);
    const sleepPerformance = clamp(sleepPerfBase + randomNoise(8), 0, 100);
    const strain = clamp(strainBase + randomNoise(3), 0, 21);
    const sleepHours = clamp(7 + Math.sin(i / 9) + randomNoise(1), 3, 10);

    result.push({
      date: toISODate(d),
      recovery,
      sleepPerformance,
      strain,
      sleepHours,
    });
  }

  return result;
}

function randomNoise(sd: number): number {
  const u = 1 - Math.random();
  const v = 1 - Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * sd;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
