"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { NavTabs } from "../components/NavTabs";
import { ShareModal } from "../components/ShareModal";
import { GridSkeleton } from "../components/Skeleton";
import { generateMockMetrics } from "../lib/mockData";
import { DailyMetrics } from "../lib/types";
import { useReadout } from "../lib/useReadout";
import { readWhoopCache, writeWhoopCache } from "../lib/whoopDataCache";
import { DashboardProvider } from "../lib/DashboardContext";

const YEAR_DAYS = 365;

async function fetchDailyMetrics(days: number): Promise<DailyMetrics[] | null> {
  try {
    const res = await fetch(`/api/whoop/daily-metrics?days=${days}`);
    if (!res.ok) return null;
    return (await res.json()) as DailyMetrics[];
  } catch {
    return null;
  }
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [rangeDays, setRangeDays] = useState<number>(YEAR_DAYS);

  // Always a full year — every range view (30/90/365) and every other tab
  // is derived from this single fetch, so we only ever hit the WHOOP API once.
  const [yearData, setYearData] = useState<DailyMetrics[] | null>(null);
  const [connected, setConnected] = useState(false);
  // True until we know whether the user is authenticated — avoids flashing
  // "Connect WHOOP" + mock data before that first fetch resolves.
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const cached = readWhoopCache();
    if (cached) {
      setYearData(cached);
      setConnected(true);
      setAuthChecked(true);
      return;
    }

    fetchDailyMetrics(YEAR_DAYS).then((json) => {
      setYearData(json);
      setConnected(json !== null);
      setAuthChecked(true);
      if (json !== null) writeWhoopCache(json);
    });
  }, []);

  // Real page navigations already reset scroll on their own; this only
  // covers the client-side transitions between these tab routes.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  // generateMockMetrics uses Math.random(), so it must never run during SSR
  // or the server/client markup would mismatch on hydration — only compute it
  // once mounted (client-only). useReadout must still be called unconditionally
  // every render (rules of hooks), so it gets [] pre-mount; that's deterministic
  // and safe since useReadout's own returned value doesn't render until an
  // effect updates it, well after hydration.
  const yearMetrics = mounted
    ? (yearData ?? generateMockMetrics(YEAR_DAYS))
    : [];
  const { readout, error: readoutError } = useReadout(yearMetrics, connected);

  if (!mounted) {
    return <main className="min-h-screen pb-[70px]" />;
  }

  const rangeMetrics = yearMetrics.slice(-rangeDays);

  return (
    <main className="min-h-screen pb-[70px]">
      <div className="mx-auto max-w-[1120px] px-7">
        <div className="flex flex-wrap items-center gap-4 py-[22px] pb-1">
          <div className="mr-auto flex items-center gap-2.5">
            <span className="text-xl font-semibold tracking-[-.01em]">
              Signal
            </span>
          </div>

          <NavTabs enabled={authChecked} />

          {authChecked && !connected && (
            <a
              href="/api/auth/whoop/login"
              className="rounded-full bg-[#2c2722] px-[19px] py-3 text-[13px] font-medium text-[#fbfaf8] hover:bg-[#463d35]"
            >
              Connect WHOOP
            </a>
          )}
          <button
            onClick={() => authChecked && setShareOpen(true)}
            disabled={!authChecked}
            className="rounded-full bg-[#cf6b4e] px-[19px] py-3 text-[13px] font-medium text-[#fbfaf8] enabled:hover:bg-[#b8583d] disabled:cursor-default disabled:opacity-50"
          >
            My Card
          </button>
        </div>

        {!authChecked && <GridSkeleton />}

        {authChecked && (
          <DashboardProvider
            value={{
              yearMetrics,
              rangeMetrics,
              rangeDays,
              setRangeDays,
              readout,
              readoutError,
              connected,
            }}
          >
            {children}
          </DashboardProvider>
        )}
      </div>

      {shareOpen && (
        <ShareModal onClose={() => setShareOpen(false)} data={yearMetrics} />
      )}
    </main>
  );
}
