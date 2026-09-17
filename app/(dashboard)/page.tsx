"use client";

import { useRouter } from "next/navigation";
import { GridTab } from "../components/tabs/GridTab";
import { useDashboard } from "../lib/DashboardContext";

export default function GridPage() {
  const router = useRouter();
  const { rangeMetrics, rangeDays, setRangeDays, readout, readoutError, yearMetrics } =
    useDashboard();

  return (
    <GridTab
      rangeData={rangeMetrics}
      rangeDays={rangeDays}
      onRangeChange={setRangeDays}
      readout={readout}
      readoutError={readoutError}
      yearData={yearMetrics}
      onOpenFullReadout={() => router.push("/insights")}
    />
  );
}
