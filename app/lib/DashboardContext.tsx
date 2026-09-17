"use client";

import { createContext, useContext } from "react";
import { DailyMetrics } from "./types";
import { Readout } from "./useReadout";

export interface DashboardContextValue {
  yearMetrics: DailyMetrics[];
  rangeMetrics: DailyMetrics[];
  rangeDays: number;
  setRangeDays: (days: number) => void;
  readout: Readout;
  readoutError: boolean;
  connected: boolean;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({
  value,
  children,
}: {
  value: DashboardContextValue;
  children: React.ReactNode;
}) {
  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) {
    throw new Error("useDashboard must be used within DashboardProvider");
  }
  return ctx;
}
