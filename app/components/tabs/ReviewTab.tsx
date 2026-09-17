import { DailyMetrics } from "../../lib/types";
import { computeStats } from "../../lib/stats";

interface ReviewTabProps {
  data: DailyMetrics[];
}

const TARGET_DAYS = 365;

export function ReviewTab({ data }: ReviewTabProps) {
  const { loggedDays } = computeStats(data);
  const unlocked = loggedDays >= TARGET_DAYS;
  const remaining = Math.max(TARGET_DAYS - loggedDays, 0);
  const pct = Math.min(100, Math.round((loggedDays / TARGET_DAYS) * 100));

  return (
    <div className="pt-5">
      <div className="rounded-[20px] border border-[#edeae4] bg-white p-11 text-left">
        <div className="mb-4.5 inline-block rounded-full bg-[#f4f1ec] px-[11px] py-1.5 text-[11.5px] font-medium text-[#665e54]">
          {unlocked ? "Unlocked" : "Not yet"}
        </div>
        <p className="mb-3 max-w-[30ch] text-[27px] font-normal leading-[1.32] tracking-[-.02em]">
          {unlocked
            ? "Your year in review is ready."
            : `Your year in review unlocks at ${TARGET_DAYS} logged days.`}
        </p>
        <p className="mb-6 max-w-[62ch] text-[15px] leading-[1.7] text-[#5d554c]">
          {unlocked
            ? "You've logged a full year of data. A scrollable recap is coming — best month, worst week, the streak that broke, the night you slept nine hours."
            : `You're at ${loggedDays}. ${remaining} more night${
                remaining === 1 ? "" : "s"
              } and this becomes a scrollable recap — best month, worst week, the streak that broke, the night you slept nine hours.`}
        </p>
        <div className="mb-2.5 h-2 max-w-[420px] overflow-hidden rounded-full bg-[#f0ede8]">
          <div
            className="h-2 bg-[#6f9e84]"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="font-mono text-xs text-[#665e54]">
          {loggedDays} / {TARGET_DAYS} days
        </div>
      </div>
    </div>
  );
}
