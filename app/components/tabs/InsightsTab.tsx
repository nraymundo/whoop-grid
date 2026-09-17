import { DailyMetrics } from "../../lib/types";
import { computeReadoutInputs } from "../../lib/stats";
import { Readout } from "../../lib/useReadout";

interface InsightsTabProps {
  data: DailyMetrics[];
  readout: Readout;
  readoutError: boolean;
}

export function InsightsTab({ data, readout, readoutError }: InsightsTabProps) {
  const inputs = computeReadoutInputs(data);

  const evidence = [
    { k: "Nights under 6h", v: String(inputs.nightsUnderSix) },
    { k: "Red recovery days", v: String(inputs.redRecoveryDays) },
    {
      k: "Strain trend, 15d",
      v: `${inputs.strainTrend >= 0 ? "+" : ""}${inputs.strainTrend}`,
    },
    {
      k: "Recovery trend, 15d",
      v: `${inputs.recoveryTrend >= 0 ? "+" : ""}${inputs.recoveryTrend}%`,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 pt-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
      <div>
        <div className="mb-3.5 rounded-[20px] border border-[#edeae4] bg-white p-[30px]">
          <div className="mb-4 flex flex-wrap items-center gap-2.5">
            <span className="rounded-full bg-[#f6e7e0] px-[11px] py-1.5 text-[11.5px] font-medium text-[#8a4a34]">
              Readout
            </span>
            <span className="font-mono text-[11.5px] text-[#665e54]">
              last 30 days
            </span>
            {readoutError && (
              <span className="font-mono text-[11px] text-[#b05537]">
                AI readout unavailable — showing default
              </span>
            )}
            <button
              disabled
              className="ml-auto rounded-full border border-[#e2ded7] px-[15px] py-[9px] text-[13px] font-medium text-[#5d554c] opacity-50 cursor-default"
            >
              Regenerate
            </button>
          </div>
          <p className="mb-5 max-w-[26ch] text-[30px] font-normal leading-[1.28] tracking-[-.02em]">
            {readout.headline}
          </p>
          <div className="grid max-w-[70ch] gap-[15px] text-[15.5px] leading-[1.72] text-[#453e37]">
            {readout.paragraphs.map((p, i) => (
              <p key={i} className="m-0">
                {p}
              </p>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-2.5 border-t border-[#f0ede8] pt-5">
            <button
              disabled
              className="rounded-full bg-[#2c2722] px-[19px] py-3 text-[13px] font-medium text-[#fbfaf8] opacity-50 cursor-default"
            >
              Ask a follow-up
            </button>
            <button
              disabled
              className="rounded-full border border-[#e2ded7] px-[19px] py-3 text-[13px] font-medium text-[#5d554c] opacity-50 cursor-default"
            >
              Share card
            </button>
          </div>
        </div>

        <div className="rounded-[20px] border border-[#edeae4] bg-white p-[22px]">
          <div className="mb-1.5 text-sm font-semibold">Earlier readouts</div>
          <div className="text-sm leading-[1.5] text-[#665e54]">
            Nothing here yet — coming soon.
          </div>
        </div>
      </div>

      <div>
        <div className="mb-3.5 rounded-[20px] border border-[#edeae4] bg-white p-[26px]">
          <div className="mb-1.5 text-sm font-semibold">What it read</div>
          <div className="mb-3 text-xs leading-[1.5] text-[#665e54]">
            30 days of four metrics. Nothing else is sent.
          </div>
          {evidence.map((e) => (
            <div
              key={e.k}
              className="flex items-baseline justify-between gap-3 border-t border-[#f4f1ec] py-[11px] first:border-t-0"
            >
              <span className="text-[13.5px] text-[#665e54]">{e.k}</span>
              <span className="font-mono text-[14.5px] font-medium">{e.v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
