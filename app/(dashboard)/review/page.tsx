"use client";

import { ReviewTab } from "../../components/tabs/ReviewTab";
import { useDashboard } from "../../lib/DashboardContext";

export default function ReviewPage() {
  const { yearMetrics } = useDashboard();

  return <ReviewTab data={yearMetrics} />;
}
