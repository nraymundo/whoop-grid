import { DailyMetrics } from "../../lib/types";
import { computeStats } from "../../lib/stats";

interface StreaksTabProps {
  data: DailyMetrics[];
}

function formatDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString(undefined, {
    month: "numeric",
    day: "numeric",
    year: "2-digit",
  });
}

function formatDateRange(start: string | null, end: string | null) {
  if (!start || !end) return null;
  return `${formatDate(start)} – ${formatDate(end)}`;
}

export function StreaksTab({ data }: StreaksTabProps) {
  const stats = computeStats(data);
  const strainRunRange = formatDateRange(
    stats.longestGreenStrainRunRange.start,
    stats.longestGreenStrainRunRange.end
  );

  const badges = [
    {
      label: `${stats.currentStreak}-day recovery streak`,
      note: "Consecutive days at green or better, right up to today.",
      meta:
        stats.currentStreak > 0
          ? `Live · ${stats.currentStreak} day${stats.currentStreak === 1 ? "" : "s"}`
          : "No active streak",
      state: stats.currentStreak > 0 ? "Earned" : "Locked",
      chip: stats.currentStreak > 0 ? "#6f9e84" : "#ece9e4",
      locked: stats.currentStreak === 0,
    },
    {
      label: "Longest green strain run",
      note: "Longest run of days with strain above 14.",
      meta: `${stats.longestGreenStrainRun} days${
        strainRunRange ? ` · ${strainRunRange}` : ""
      }`,
      state: stats.longestGreenStrainRun > 0 ? "Earned" : "Locked",
      chip: stats.longestGreenStrainRun > 0 ? "#6f9e84" : "#ece9e4",
      locked: stats.longestGreenStrainRun === 0,
    },
    {
      label: "Sleep-debt free run",
      note: "Longest run of nights at six hours or more.",
      meta: `${stats.longestSleepDebtFreeRun} nights`,
      state: stats.longestSleepDebtFreeRun >= 30 ? "Earned" : "Locked",
      chip: stats.longestSleepDebtFreeRun >= 30 ? "#dfb055" : "#ece9e4",
      locked: stats.longestSleepDebtFreeRun < 30,
    },
    {
      label: "Century of green",
      note: "One hundred green recovery days in this range.",
      meta: `${stats.greenDays} / 100`,
      state: stats.greenDays >= 100 ? "Earned" : "Locked",
      chip: stats.greenDays >= 100 ? "#6f9e84" : "#ece9e4",
      locked: stats.greenDays < 100,
    },
    {
      label: "Thirty-day streak",
      note: "A full month without a red recovery day.",
      meta: `${Math.min(stats.longestNoRedRecoveryRun, 30)} / 30${
        stats.longestNoRedRecoveryRun < 30 ? " — in progress" : ""
      }`,
      state: stats.longestNoRedRecoveryRun >= 30 ? "Earned" : "Locked",
      chip: stats.longestNoRedRecoveryRun >= 30 ? "#6f9e84" : "#ece9e4",
      locked: stats.longestNoRedRecoveryRun < 30,
    },
    {
      label: "Full year logged",
      note: "Wear the band for 365 consecutive days.",
      meta: `${stats.loggedDays} / 365`,
      state: stats.loggedDays >= 365 ? "Earned" : "Locked",
      chip: stats.loggedDays >= 365 ? "#6f9e84" : "#ece9e4",
      locked: stats.loggedDays < 365,
    },
  ];

  return (
    <div className="pt-5">
      <div className="mb-4 flex flex-wrap items-center gap-[30px] rounded-[20px] border border-[#edeae4] bg-white p-[30px]">
        <div>
          <div className="mb-2.5 text-xs font-medium text-[#665e54]">
            Current recovery streak
          </div>
          <div className="flex items-baseline gap-2.5">
            <span className="text-[56px] font-light leading-none tracking-[-.03em]">
              {stats.currentStreak}
            </span>
            <span className="text-[15px] text-[#665e54]">
              {stats.currentStreak === 1 ? "day" : "days"} green or better
            </span>
          </div>
        </div>
        <div className="ml-auto flex gap-[5px]">
          {stats.streakDots.map((d, i) => (
            <span
              key={i}
              className="block h-8 w-4 rounded-[5px]"
              style={{ background: d.bg }}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-3.5">
        {badges.map((b) => (
          <div
            key={b.label}
            className="rounded-[20px] border border-[#edeae4] bg-white p-[22px]"
            style={{ opacity: b.locked ? 0.62 : 1 }}
          >
            <div className="mb-3.5 flex items-center gap-[11px]">
              <span
                className="block h-[34px] w-[34px] flex-none rounded-full"
                style={{ background: b.chip }}
              />
              <span
                className="text-[11.5px] font-medium"
                style={{ color: b.locked ? "#7c7368" : "#4f7a62" }}
              >
                {b.state}
              </span>
            </div>
            <div className="mb-1 text-[15px] font-semibold leading-[1.3]">
              {b.label}
            </div>
            <div className="text-[13px] leading-[1.55] text-[#665e54]">
              {b.note}
            </div>
            <div className="mt-3.5 font-mono text-xs text-[#665e54]">
              {b.meta}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
