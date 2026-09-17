import { DailyMetrics } from "./types";

const CACHE_KEY = "signal:whoop-data-cache";
// WHOOP data changes at most a few times a day (nightly recovery sync, cycle
// updates after workouts) — no need to hit the API on every page load.
const TTL_MS = 15 * 60 * 1000;

type Cache = { data: DailyMetrics[]; fetchedAt: number };

export function readWhoopCache(): DailyMetrics[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cache: Cache = JSON.parse(raw);
    if (Date.now() - cache.fetchedAt > TTL_MS) return null;
    return cache.data;
  } catch {
    return null;
  }
}

export function writeWhoopCache(data: DailyMetrics[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, fetchedAt: Date.now() }));
  } catch {
    // localStorage unavailable (private browsing, etc.) — safe to skip caching.
  }
}
