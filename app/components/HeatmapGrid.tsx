"use client";

import React, { useEffect, useState } from "react";
import { DailyMetrics } from "../lib/types";

type MetricKey = "recovery" | "sleepPerformance" | "strain";

interface HeatmapGridProps {
  title: string;
  data: DailyMetrics[];
  metric: MetricKey;
  unit?: string;
  rangeDays: number;
  onRangeChange?: (days: number) => void;
  showRangeControl?: boolean;
}

export function HeatmapGrid({
  title,
  data,
  metric,
  unit,
  rangeDays,
  onRangeChange,
  showRangeControl,
}: HeatmapGridProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <section className="space-y-2">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          {showRangeControl ? (
            <span className="text-xs text-gray-500">Loading…</span>
          ) : (
            <span className="text-xs text-gray-500">Last {rangeDays} days</span>
          )}
        </div>
      </section>
    );
  }

  if (data.length === 0) {
    return null;
  }

  const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));
  const firstDateStr = sorted[0].date;

  const firstDateObj = new Date(firstDateStr + "T00:00:00");
  const firstWeekday = firstDateObj.getDay(); // 0 (Sun) - 6 (Sat)

  const metricValues: number[] = [];
  for (const date of sorted) {
    const raw = date[metric] as number | null;
    if (typeof raw === "number") {
      metricValues.push(raw);
    }
  }

  const hasValues = metricValues.length > 0;
  const min = hasValues ? Math.min(...metricValues) : 0;
  const max = hasValues ? Math.max(...metricValues) : 1;

  type Cell = {
    date: string;
    value: number | null;
    raw: number | null;
    weekIndex: number;
    weekday: number;
  };

  const cells: Cell[] = [];

  sorted.forEach((date, i) => {
    const iso = date.date;
    const raw = (date[metric] as number | null) ?? null;

    let normalized: number | null = null;
    if (typeof raw === "number" && max > min) {
      normalized = (raw - min) / (max - min);
    } else if (typeof raw === "number") {
      normalized = 0.5;
    }

    const weekday = (firstWeekday + i) % 7;
    const weekIndex = Math.floor((firstWeekday + i) / 7);

    cells.push({
      date: iso,
      value: normalized,
      raw,
      weekIndex,
      weekday,
    });
  });

  const weekCount =
    cells.length > 0 ? Math.max(...cells.map((cell) => cell.weekIndex)) + 1 : 0;

  const monthLabels = computeMonthLabelsFromCells(cells);

  const cellMap = new Map<string, (typeof cells)[0]>();

  for (const cell of cells) {
    cellMap.set(`${cell.weekIndex}-${cell.weekday}`, cell);
  }

  return (
    <section className="space-y-2">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xl font-semibold text-white">{title}</h2>

        {/* {showRangeControl && onRangeChange && (
          <div className="flex items-center gap-2 text-xs text-[#b4b4b4]">
            <span>Range:</span>
            <select
              value={rangeDays}
              onChange={(e) => onRangeChange(Number(e.target.value))}
              className="rounded border border-[#26333A] bg-[#26333A] px-2 py-1 text-xs text-white"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={60}>Last 60 days</option>
            </select>
          </div>
        )} */}
      </div>

      {/* Month labels row */}
      <div className="flex gap-2">
        <div style={{ width: 28 }} />
        <div className="flex-1">
          <div
            className="grid gap-[2px] mx-auto text-[12px] text-[#b4b4b4] mb-1"
            style={{
              gridTemplateColumns: `repeat(${weekCount}, 16px)`,
            }}
          >
            {monthLabels.map((label, weekIndex) => (
              <div key={weekIndex} className="text-center">
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weekday labels + heatmap grid */}
      <div className="flex gap-2">
        <div
          className="grid gap-[2px] text-[12px] text-[#b4b4b4]"
          style={{
            width: 28,
            gridTemplateRows: "repeat(7, 16px)",
          }}
        >
          {["Sun", "", "Tue", "", "Thu", "", "Sat"].map((label, i) => (
            <div key={i} className="flex items-center justify-end pr-1">
              {label}
            </div>
          ))}
        </div>

        {/* Heatmap */}
        <div className="flex-1 overflow-x-auto">
          <div className="w-full">
            <div
              className="grid gap-[2px] mx-auto"
              style={{
                gridTemplateColumns: `repeat(${weekCount}, 16px)`,
                gridTemplateRows: "repeat(7, 16px)",
              }}
            >
              {Array.from({ length: weekCount }).map((_, week) =>
                Array.from({ length: 7 }).map((_, weekday) => {
                  const key = `${week}-${weekday}`;
                  const cell = cellMap.get(key);
                  return (
                    <div
                      key={key}
                      className="rounded-sm"
                      style={{
                        gridColumnStart: week + 1,
                        gridRowStart: weekday + 1,
                        backgroundColor: cell
                          ? valueToColor(cell.raw, metric)
                          : "#E5E7EB",
                      }}
                      title={
                        cell ? tooltipForCell(cell, metric, unit) : "No data"
                      }
                    />
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1 text-[12px] text-[#b4b4b4]">
        <span>Low</span>
        {metric === "strain"
          ? ["Low", "Mid", "High"].map((_, i) => (
              <span
                key={i}
                className="h-3 w-3 rounded-sm inline-block"
                style={{
                  backgroundColor: valueToColor(
                    i === 0 ? 5 : i === 1 ? 12 : 18,
                    metric
                  ),
                }}
              />
            ))
          : ["Low", "Mid", "High"].map((_, i) => (
              <span
                key={i}
                className="h-3 w-3 rounded-sm inline-block"
                style={{
                  backgroundColor: valueToColor(
                    i === 0 ? 10 : i === 1 ? 50 : 90,
                    metric
                  ),
                }}
              />
            ))}
        <span>High</span>
      </div>
    </section>
  );
}

function computeMonthLabelsFromCells(
  cells: {
    date: string;
    weekIndex: number;
  }[]
): string[] {
  if (cells.length === 0) return [];

  const weekCount = Math.max(...cells.map((c) => c.weekIndex)) + 1;

  // Map: monthIndex (0–11) -> weekIndex where day === 1
  const monthToWeek = new Map<number, number>();

  for (const cell of cells) {
    const d = new Date(cell.date + "T00:00:00");
    const day = d.getDate();
    const month = d.getMonth();

    // we only care about the 1st of the month
    if (day === 1) {
      // only take the first weekIndex we see for that month
      if (!monthToWeek.has(month)) {
        monthToWeek.set(month, cell.weekIndex);
      }
    }
  }

  const labels: string[] = Array(weekCount).fill("");

  // Place labels at the weekIndex where the 1st occurs
  for (const [month, weekIndex] of monthToWeek.entries()) {
    if (weekIndex < 0 || weekIndex >= weekCount) continue;
    const d = new Date(2000, month, 1); // year doesn't matter for month name
    labels[weekIndex] = d.toLocaleString(undefined, { month: "short" });
  }

  return labels;
}

function valueToColor(value: number | null, metric: MetricKey): string {
  if (value === null || Number.isNaN(value)) {
    return "#E5E7EB";
  }

  const RED = "#FF0026";
  const YELLOW = "#FFDE00";
  const GREEN = "#16EC06";

  if (metric === "recovery" || metric === "sleepPerformance") {
    if (value <= 33) return RED;
    if (value <= 66) return YELLOW;
    return GREEN;
  }

  if (metric === "strain") {
    if (value <= 9) return RED;
    if (value <= 14) return YELLOW;
    return GREEN;
  }

  return "#CBD5E1";
}

function tooltipForCell(
  cell: { date: string; raw: number | null },
  metric: MetricKey,
  unit?: string
): string {
  const labelMap: Record<MetricKey, string> = {
    recovery: "Recovery",
    sleepPerformance: "Sleep performance",
    strain: "Strain",
  };

  const dateStr = new Date(cell.date + "T00:00:00").toLocaleDateString(
    undefined,
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );

  const metricLabel = labelMap[metric];
  const valueStr =
    cell.raw === null || Number.isNaN(cell.raw)
      ? "no data"
      : `${cell.raw.toFixed(1)}${unit ?? ""}`;

  return `${dateStr} • ${metricLabel}: ${valueStr}`;
}
