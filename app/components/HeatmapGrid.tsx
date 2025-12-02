"use client";

import React from "react";
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
  if (data.length === 0) {
    return null;
  }

  // 1) Sort & get first/last dates
  const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));
  const firstDateStr = sorted[0].date;
  const lastDateStr = sorted[sorted.length - 1].date;

  // Minimal Date usage: just to get weekday + month labels
  const firstDateObj = new Date(firstDateStr + "T00:00:00");
  const firstWeekday = firstDateObj.getDay(); // 0 (Sun) - 6 (Sat)
  const totalDays = sorted.length;

  // Collect metric values (for normalized value if you still want it later)
  const metricValues: number[] = [];
  for (const d of sorted) {
    const raw = d[metric] as number | null;
    if (typeof raw === "number") {
      metricValues.push(raw);
    }
  }

  const hasValues = metricValues.length > 0;
  const min = hasValues ? Math.min(...metricValues) : 0;
  const max = hasValues ? Math.max(...metricValues) : 1;

  type Cell = {
    date: string;
    value: number | null; // normalized 0–1 or null (if you want it)
    raw: number | null;
    weekIndex: number;
    weekday: number; // 0 (Sun) - 6 (Sat)
  };

  const cells: Cell[] = [];

  // 2) Use array index to decide week/weekday
  sorted.forEach((d, i) => {
    const iso = d.date;
    const raw = (d[metric] as number | null) ?? null;

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
    cells.length > 0 ? Math.max(...cells.map((c) => c.weekIndex)) + 1 : 0;

  const monthLabels = computeMonthLabels(firstDateStr, firstWeekday, weekCount);

  const cellMap = new Map<string, (typeof cells)[0]>();

  for (const cell of cells) {
    cellMap.set(`${cell.weekIndex}-${cell.weekday}`, cell);
  }

  return (
    <section className="space-y-2">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>

        {showRangeControl && onRangeChange ? (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Range:</span>
            <select
              value={rangeDays}
              onChange={(e) => onRangeChange(Number(e.target.value))}
              className="rounded border border-gray-300 bg-white px-2 py-1 text-xs"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={60}>Last 60 days</option>
            </select>
          </div>
        ) : (
          <span className="text-xs text-gray-500">Last {rangeDays} days</span>
        )}
      </div>

      {/* Month labels row */}
      <div className="flex gap-2">
        {/* spacer so month labels line up with heatmap columns */}
        <div style={{ width: 28 }} />
        <div
          className="grid flex-1 text-[10px] text-gray-500 mb-1"
          style={{
            gridTemplateColumns: `repeat(${weekCount}, minmax(10px, 1fr))`,
          }}
        >
          {monthLabels.map((label, weekIndex) => (
            <div key={weekIndex} className="text-center">
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Weekday labels + heatmap grid */}
      <div className="flex gap-2">
        {/* Weekday labels — 7-row grid that matches heatmap rows */}
        <div
          className="grid gap-[2px] text-[10px] text-gray-500"
          style={{
            width: 28, // match spacer width above
            gridTemplateRows: "repeat(7, 12px)",
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
          <div
            className="grid gap-[2px]"
            style={{
              gridTemplateColumns: `repeat(${weekCount}, minmax(10px, 1fr))`,
              gridTemplateRows: "repeat(7, 12px)",
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
                        : "#E5E7EB", // gray filler
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

      {/* Legend */}
      <div className="flex items-center gap-1 text-[10px] text-gray-500">
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

/**
 * Compute month labels per week, based on the first date
 * and the fact that weekIndex = floor((firstWeekday + i) / 7)
 */
function computeMonthLabels(
  firstDateStr: string,
  firstWeekday: number,
  weekCount: number
): string[] {
  const labels: string[] = [];
  const firstDate = new Date(firstDateStr + "T00:00:00");

  for (let w = 0; w < weekCount; w++) {
    // index of the first day that falls into this week
    const dayIndex = w * 7 - firstWeekday;
    if (dayIndex < 0) {
      labels.push("");
      continue;
    }

    const d = new Date(firstDate);
    d.setDate(d.getDate() + dayIndex);

    if (d.getDate() <= 7) {
      labels.push(
        d.toLocaleString(undefined, {
          month: "short",
        })
      );
    } else {
      labels.push("");
    }
  }

  return labels;
}

function valueToColor(value: number | null, metric: MetricKey): string {
  if (value === null || Number.isNaN(value)) {
    return "#E5E7EB"; // gray (no data)
  }

  // WHOOP-style traffic light bands
  const RED = "#EF4444";
  const YELLOW = "#FACC15";
  const GREEN = "#22C55E";

  if (metric === "recovery" || metric === "sleepPerformance") {
    // higher = better
    if (value <= 33) return RED;
    if (value <= 66) return YELLOW;
    return GREEN;
  }

  if (metric === "strain") {
    // higher = better (invert so LOW = red, HIGH = green)
    if (value <= 9) return RED;
    if (value <= 14) return YELLOW;
    return GREEN;
  }

  return "#CBD5E1"; // fallback
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
