"use client";

import { useEffect, useState } from "react";
import { HeatmapGrid } from "./components/HeatmapGrid";
import { generateMockMetrics } from "./lib/mockData";
import { DailyMetrics } from "./lib/types";

export default function HomePage() {
  const [data, setData] = useState<DailyMetrics[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Always have mock data available as fallback
  const mock = generateMockMetrics(180);
  const metrics = data ?? mock;
  const usingMock = data === null;

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);

        const res = await fetch("/api/whoop/daily-metrics?days=180", {
          method: "GET",
          // same-origin fetch automatically sends cookies
        });

        if (!res.ok) {
          const text = await res.text();
          console.error("Failed to fetch daily metrics:", text);
          setErrorMsg("Could not load WHOOP data; showing mock data.");
          setData(null);
          return;
        }

        const json = (await res.json()) as DailyMetrics[];
        setData(json);
      } catch (err) {
        console.error("Error fetching daily metrics:", err);
        setErrorMsg("Could not load WHOOP data; showing mock data.");
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-8">
        <header className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold">WHOOP Daily Grid</h1>
              <p className="text-sm text-gray-600 max-w-xl">
                GitHub-style calendar heatmaps for your WHOOP metrics. Connect
                your WHOOP account to see real recovery, sleep, and strain data.
              </p>
              {usingMock && (
                <p className="text-xs text-amber-600">
                  Showing mock data. Click &quot;Connect WHOOP&quot; and refresh
                  to load your real metrics.
                </p>
              )}
              {errorMsg && <p className="text-xs text-red-600">{errorMsg}</p>}
            </div>

            <a
              href="/api/auth/whoop/login"
              className="shrink-0 inline-block rounded bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-80"
            >
              Connect WHOOP
            </a>
          </div>
          {loading && (
            <p className="text-xs text-gray-500">Loading metrics from WHOOP…</p>
          )}
        </header>

        <div className="space-y-6">
          <HeatmapGrid
            title="Recovery"
            data={metrics}
            metric="recovery"
            unit="%"
          />

          <HeatmapGrid
            title="Sleep Performance"
            data={metrics}
            metric="sleepPerformance"
            unit="%"
          />

          <HeatmapGrid title="Strain" data={metrics} metric="strain" />
        </div>
      </div>
    </main>
  );
}
