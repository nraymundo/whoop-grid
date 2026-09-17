import { HeatmapGrid } from "../HeatmapGrid";
import { DailyMetrics } from "../../lib/types";
import { computeStats } from "../../lib/stats";
import { Readout } from "../../lib/useReadout";

interface GridTabProps {
  rangeData: DailyMetrics[];
  yearData: DailyMetrics[];
  rangeDays: number;
  onRangeChange: (days: number) => void;
  readout: Readout;
  readoutError: boolean;
  onOpenFullReadout: () => void;
}

export function GridTab({
  rangeData,
  yearData,
  rangeDays,
  onRangeChange,
  readout,
  readoutError,
  onOpenFullReadout,
}: GridTabProps) {
  const stats = computeStats(rangeData);
  const rangeLabel = rangeDays === 365 ? "last year" : `last ${rangeDays} days`;

  const TILES = [
    {
      label: "Avg recovery",
      value: stats.avgRecovery !== null ? Math.round(stats.avgRecovery) : "—",
      unit: "%",
      note: rangeLabel,
    },
    {
      label: "Avg sleep",
      value:
        stats.avgSleepPerformance !== null
          ? Math.round(stats.avgSleepPerformance)
          : "—",
      unit: "%",
      note:
        stats.avgSleepHours !== null
          ? `${stats.avgSleepHours.toFixed(1)}h median`
          : "no sleep data",
    },
    {
      label: "Avg strain",
      value: stats.avgStrain !== null ? stats.avgStrain.toFixed(1) : "—",
      unit: "",
      note: rangeLabel,
    },
    {
      label: "Current streak",
      value: stats.currentStreak,
      unit: " days",
      note: "green or better",
    },
  ];

  return (
    <div className="pt-5">
      <div className="mb-4 rounded-[20px] border border-[#edeae4] bg-white p-7">
        <div className="mb-4 flex flex-wrap items-center gap-2.5">
          <span className="block h-2 w-2 rounded-full bg-[#cf6b4e]" />
          <span className="text-xs font-medium text-[#665e54]">
            Last 30 days
          </span>
          {readoutError && (
            <span className="font-mono text-[11px] text-[#b05537]">
              AI readout unavailable — showing default
            </span>
          )}
        </div>
        <p className="mb-3 max-w-[44ch] text-[25px] font-normal leading-[1.35] tracking-[-.015em]">
          {readout.headline}
        </p>
        <p className="max-w-[76ch] text-[15px] leading-[1.7] text-[#5d554c]">
          {readout.short}
        </p>
        <div className="mt-5 flex flex-wrap gap-2.5">
          <button
            onClick={onOpenFullReadout}
            className="rounded-full bg-[#2c2722] px-[19px] py-3 text-[13px] font-medium text-[#fbfaf8] hover:bg-[#463d35]"
          >
            Open full readout
          </button>
          <button
            disabled
            className="rounded-full border border-[#e2ded7] px-[19px] py-3 text-[13px] font-medium text-[#5d554c] opacity-50 cursor-default"
          >
            Share this
          </button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-3.5">
        {TILES.map((t) => (
          <div
            key={t.label}
            className="rounded-[20px] border border-[#edeae4] bg-white px-5 py-[18px]"
          >
            <div className="text-xs font-medium text-[#7c7368]">{t.label}</div>
            <div className="my-[10px] text-[34px] font-light leading-[1.1]">
              {t.value}
              <span className="text-base text-[#7c7368]">{t.unit}</span>
            </div>
            <div className="font-mono text-[11.5px] text-[#7c7368]">
              {t.note}
            </div>
          </div>
        ))}
      </div>

      <div className="mb-3.5 flex flex-wrap items-center gap-3">
        <h2 className="mr-auto text-base font-semibold">Your Grid</h2>
        <div className="flex gap-0.5 rounded-full bg-[#f4f1ec] p-1">
          {[30, 90, 365].map((d) => (
            <button
              key={d}
              onClick={() => onRangeChange(d)}
              className={`rounded-full px-[13px] py-[7px] text-xs font-medium ${
                rangeDays === d
                  ? "bg-white text-[#2c2722] shadow-sm"
                  : "text-[#665e54]"
              }`}
            >
              {d === 365 ? "Year" : `${d} days`}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3.5">
        <HeatmapGrid
          title="Recovery"
          data={rangeData}
          metric="recovery"
          unit="%"
          rangeDays={rangeDays}
        />
        <HeatmapGrid
          title="Sleep Performance"
          data={rangeData}
          metric="sleepPerformance"
          unit="%"
          rangeDays={rangeDays}
        />
        <HeatmapGrid
          title="Strain"
          data={rangeData}
          metric="strain"
          rangeDays={rangeDays}
        />
      </div>
    </div>
  );
}
