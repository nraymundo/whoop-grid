"use client";

import { StreaksTab } from "../../components/tabs/StreaksTab";
import { useDashboard } from "../../lib/DashboardContext";

export default function StreaksPage() {
  const { yearMetrics } = useDashboard();

  return <StreaksTab data={yearMetrics} />;
}
