import { useEffect, useState } from "react";
import { DailyMetrics } from "./types";
import { computeReadoutInputs } from "./stats";

export type Readout = { headline: string; short: string; paragraphs: string[] };

export const FALLBACK_READOUT: Readout = {
  headline: "You're overreaching — and short sleep is doing most of the damage.",
  short:
    "Recovery dropped Tuesday through Thursday, right after two nights under six hours. Strain is up while recovery slid.",
  paragraphs: [
    "Recovery cratered Tuesday to Thursday, right after two nights under six hours. Every sub-6h night this month was followed by a red or yellow day — no exceptions.",
    "Strain is up over three weeks while recovery has drifted down. Load is rising and the engine is not keeping pace.",
    "The good news is your weekends are clean — nine of the last ten Sundays came back green.",
  ],
};

const READOUT_CACHE_KEY = "whoopgrid:readout-cache";

type ReadoutCache = { inputs: string } & Readout;

function readCache(): ReadoutCache | null {
  try {
    const raw = localStorage.getItem(READOUT_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeCache(entry: ReadoutCache) {
  try {
    localStorage.setItem(READOUT_CACHE_KEY, JSON.stringify(entry));
  } catch {
    // localStorage unavailable (private browsing, etc.) — safe to skip caching.
  }
}

/**
 * Fetches (and caches in localStorage) the AI-generated readout for a year of
 * WHOOP data. Shared by GridTab and InsightsTab so both tabs being mounted at
 * once doesn't trigger two concurrent calls or show different headlines.
 */
export function useReadout(yearData: DailyMetrics[]) {
  const [readout, setReadout] = useState<Readout | null>(null);
  const [error, setError] = useState(false);

  // Stringified stats the readout is based on. This only changes when the
  // underlying WHOOP data actually changes (new day synced, a score updated),
  // so it doubles as a cache key: same inputs -> reuse the cached readout
  // instead of calling the API again.
  const inputsStr = JSON.stringify(computeReadoutInputs(yearData));

  useEffect(() => {
    const cached = readCache();
    // Guard against a stale cache entry saved before `paragraphs` existed.
    if (cached && cached.inputs === inputsStr && Array.isArray(cached.paragraphs)) {
      setReadout({
        headline: cached.headline,
        short: cached.short,
        paragraphs: cached.paragraphs,
      });
      setError(false);
      return;
    }

    let cancelled = false;
    setError(false);

    fetch("/api/insights", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: inputsStr,
    })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((json: Readout) => {
        if (cancelled) return;
        setReadout(json);
        writeCache({ inputs: inputsStr, ...json });
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [inputsStr]);

  return { readout: readout ?? FALLBACK_READOUT, loaded: readout !== null, error };
}
