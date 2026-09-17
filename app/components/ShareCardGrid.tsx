"use client";

import { useEffect, useRef, useState } from "react";
import { DailyMetrics } from "../lib/types";
import { band, BAND_COLOR } from "../lib/stats";

interface ShareCardGridProps {
  data: DailyMetrics[];
  noMarginBottom?: boolean;
}

const CELL_PAD = 8; // matches the container's p-2
const GAP = 2;

export function ShareCardGrid({ data, noMarginBottom }: ShareCardGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const marginClass = noMarginBottom ? "" : "mb-5";

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setWidth(entry.contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));

  if (sorted.length === 0) {
    return (
      <div
        ref={containerRef}
        className={`${marginClass} h-[120px] w-full rounded-lg bg-[#f4f1ec]`}
      />
    );
  }

  const firstWeekday = new Date(sorted[0].date + "T00:00:00").getDay();
  const cells = sorted.map((d, i) => ({
    weekIndex: Math.floor((firstWeekday + i) / 7),
    weekday: (firstWeekday + i) % 7,
    color: BAND_COLOR[band(d.recovery, "recovery")],
  }));
  const weekCount = Math.max(...cells.map((c) => c.weekIndex)) + 1;

  // Cells are always square, sized from the available width — not stretched
  // to fill a fixed height — so this always matches the downloaded PNG,
  // which sizes its cells the same way.
  const innerW = width - CELL_PAD * 2 - GAP * (weekCount - 1);
  const cellSize = width > 0 ? Math.max(2, innerW / weekCount) : 0;
  const gridHeight = cellSize > 0 ? CELL_PAD * 2 + cellSize * 7 + GAP * 6 : 120;

  return (
    <div
      ref={containerRef}
      className={`${marginClass} grid w-full gap-[2px] rounded-lg bg-[#f4f1ec] p-2`}
      style={{
        height: gridHeight,
        gridTemplateColumns: `repeat(${weekCount}, ${cellSize}px)`,
        gridTemplateRows: `repeat(7, ${cellSize}px)`,
      }}
    >
      {cells.map((c, i) => (
        <div
          key={i}
          style={{
            gridColumnStart: c.weekIndex + 1,
            gridRowStart: c.weekday + 1,
            background: c.color,
          }}
        />
      ))}
    </div>
  );
}
