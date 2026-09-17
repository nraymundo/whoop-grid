"use client";

import { InsightsTab } from "../../components/tabs/InsightsTab";
import { useDashboard } from "../../lib/DashboardContext";

export default function InsightsPage() {
  const { yearMetrics, readout, readoutError } = useDashboard();

  return (
    <InsightsTab data={yearMetrics} readout={readout} readoutError={readoutError} />
  );
}
