"use client";

import React from "react";
import { DailyMetrics } from "../lib/types";

type MetricKey = "recovery" | "sleepPerformance" | "strain";

interface HeatmapGridProps {
  title: string;
  data: DailyMetrics[];
  metric: MetricKey;
  unit?: string; // e.g. "%", ""
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function HeatmapGrid({ title, data, metric, unit }: HeatmapGridProps) {
  if (data.length === 0) {
    return null;
  }

  const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));
  const dates = sorted.map((d) => new Date(d.date));

  const startDate = startOfWeek(dates[0]);
  const endDate = dates[dates.length - 1];
  const totalDays =
    Math.floor((endDate.getTime() - startDate.getTime()) / DAY_MS) + 1;
  const numWeeks = Math.ceil(totalDays / 7);

  // Collect metric values for normalization
  const metricValues: number[] = [];
  const valueByDate = new Map<string, number | null>();

  for (const d of sorted) {
    const raw = d[metric] as number | null;
    if (typeof raw === "number") {
      metricValues.push(raw);
      valueByDate.set(d.date, raw);
    } else {
      valueByDate.set(d.date, null);
    }
  }

  const hasValues = metricValues.length > 0;
  const min = hasValues ? Math.min(...metricValues) : 0;
  const max = hasValues ? Math.max(...metricValues) : 1;

  type Cell = {
    date: string;
    value: number | null; // normalized 0–1 or null
    raw: number | null;
    weekIndex: number;
    weekday: number; // 0 (Sun) - 6 (Sat)
  };

  const cells: Cell[] = [];

  for (let i = 0; i < totalDays; i++) {
    const d = new Date(startDate.getTime() + i * DAY_MS);
    const iso = d.toISOString().slice(0, 10);
    const raw = valueByDate.get(iso) ?? null;

    let normalized: number | null = null;
    if (typeof raw === "number" && max > min) {
      normalized = (raw - min) / (max - min);
    } else if (typeof raw === "number") {
      normalized = 0.5; // all values equal
    }

    const weekday = d.getDay(); // 0 (Sun) - 6 (Sat)
    const weekIndex = Math.floor(i / 7);

    cells.push({
      date: iso,
      value: normalized,
      raw,
      weekIndex,
      weekday,
    });
  }

  const weekCount = numWeeks;
  const monthLabels = computeMonthLabels(startDate, weekCount);

  return (
    <section className="space-y-2">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        <span className="text-xs text-gray-500">
          Last {Math.round(totalDays / 30)} months
        </span>
      </div>

      <div className="flex gap-2">
        {/* Weekday labels */}
        <div className="flex flex-col justify-between py-1 text-[10px] text-gray-500">
          <span>Sun</span>
          <span>Tue</span>
          <span>Thu</span>
          <span>Sat</span>
        </div>

        <div className="flex-1 overflow-x-auto">
          {/* Month labels row */}
          <div
            className="grid text-[10px] text-gray-500 mb-1"
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

          {/* Heatmap grid */}
          <div
            className="grid gap-[2px]"
            style={{
              gridTemplateColumns: `repeat(${weekCount}, minmax(10px, 1fr))`,
              gridTemplateRows: "repeat(7, 12px)",
            }}
          >
            {cells.map((cell) => (
              <div
                key={cell.date}
                className="rounded-sm"
                style={{
                  gridColumnStart: cell.weekIndex + 1,
                  gridRowStart: cell.weekday + 1,
                  backgroundColor: valueToColor(cell.value),
                }}
                title={tooltipForCell(cell, metric, unit)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1 text-[10px] text-gray-500">
        <span>Low</span>
        {[0, 0.25, 0.5, 0.75, 1].map((v) => (
          <span
            key={v}
            className="h-3 w-3 rounded-sm inline-block"
            style={{ backgroundColor: valueToColor(v) }}
          />
        ))}
        <span>High</span>
      </div>
    </section>
  );
}

function startOfWeek(date: Date): Date {
  // Start on Sunday
  const d = new Date(date);
  const day = d.getDay(); // 0 (Sun) - 6 (Sat)
  const diff = d.getDate() - day;
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function computeMonthLabels(start: Date, weekCount: number): string[] {
  const labels: string[] = [];
  const ref = new Date(start);

  for (let w = 0; w < weekCount; w++) {
    const d = new Date(ref.getTime() + w * 7 * DAY_MS);
    // Label when it's the first week of a month
    if (d.getDate() <= 7) {
      labels.push(d.toLocaleString(undefined, { month: "short" }));
    } else {
      labels.push("");
    }
  }

  return labels;
}

function valueToColor(value: number | null): string {
  if (value === null || Number.isNaN(value)) {
    return "#e5e7eb"; // gray-200
  }

  const v = Math.max(0, Math.min(1, value));

  // 5-step bucket similar to GitHub
  if (v === 0) return "#edf2f7"; // very light
  if (v < 0.25) return "#c6f6d5";
  if (v < 0.5) return "#9ae6b4";
  if (v < 0.75) return "#68d391";
  return "#38a169";
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

  const dateStr = new Date(cell.date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const metricLabel = labelMap[metric];
  const valueStr =
    cell.raw === null || Number.isNaN(cell.raw)
      ? "no data"
      : `${cell.raw.toFixed(1)}${unit ?? ""}`;

  return `${dateStr} • ${metricLabel}: ${valueStr}`;
}
