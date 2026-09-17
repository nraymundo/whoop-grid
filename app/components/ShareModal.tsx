"use client";

import { useState } from "react";
import { DailyMetrics } from "../lib/types";
import { ShareCardGrid } from "./ShareCardGrid";
import { downloadShareCardPng } from "../lib/shareCardImage";
import { computeStats } from "../lib/stats";

interface ShareModalProps {
  onClose: () => void;
  data: DailyMetrics[];
}

const BG_SWATCHES = [
  { hex: "#cf6b4e", check: "#fbfaf8" },
  { hex: "#dfb055", check: "#2c2722" },
  { hex: "#6f9e84", check: "#fbfaf8" },
  { hex: "#fbfaf8", check: "#2c2722" },
  { hex: "#2c2722", check: "#fbfaf8" },
];

export function ShareModal({ onClose, data }: ShareModalProps) {
  const [hideNumbers, setHideNumbers] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [bgColor, setBgColor] = useState(BG_SWATCHES[0].hex);

  const stats = computeStats(data);
  const cardStats = {
    avgRecovery: stats.avgRecovery !== null ? Math.round(stats.avgRecovery) : "—",
    greenDays: stats.greenDays,
    bestStreak: stats.longestGreenRecoveryRun,
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadShareCardPng(data, hideNumbers, cardStats, bgColor);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 grid place-items-center bg-[#2c2722]/[.42] p-7"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[740px] rounded-3xl bg-[#fbfaf8] p-[26px] shadow-2xl"
      >
        <div className="flex items-center gap-3">
          <span className="text-base font-semibold">My Card</span>
          <button
            onClick={onClose}
            className="ml-auto rounded-full border border-[#e2ded7] px-3.5 py-2 text-[13px] font-medium text-[#5d554c] hover:bg-[#f4f1ec]"
          >
            Close
          </button>
        </div>

        <div
          className="mt-7 rounded-3xl p-[50px]"
          style={{ background: bgColor }}
        >
          <div className="rounded-2xl border border-[#edeae4] bg-white p-[26px]">
            <div className="mb-5 flex items-baseline gap-2.5">
              <span className="text-[13px] font-semibold">Whoopty</span>
              <span className="font-mono text-[11.5px] text-[#665e54]">
                Sep 2025 – Sep 2026
              </span>
            </div>
            <ShareCardGrid data={data} noMarginBottom={hideNumbers} />
            {!hideNumbers && (
              <div className="flex flex-wrap gap-[26px]">
                <div>
                  <div className="mb-1.5 text-[11px] text-[#665e54]">
                    Avg recovery
                  </div>
                  <div className="text-[26px] font-light">
                    {cardStats.avgRecovery}%
                  </div>
                </div>
                <div>
                  <div className="mb-1.5 text-[11px] text-[#665e54]">
                    Green days
                  </div>
                  <div className="text-[26px] font-light">
                    {cardStats.greenDays}
                  </div>
                </div>
                <div>
                  <div className="mb-1.5 text-[11px] text-[#665e54]">
                    Best streak
                  </div>
                  <div className="text-[26px] font-light">
                    {cardStats.bestStreak} d
                  </div>
                </div>
                <div className="ml-auto self-end font-mono text-[11.5px] text-[#665e54]">
                  whoopgrid.app
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="my-3 flex items-center gap-2">
          {BG_SWATCHES.map((s) => (
            <button
              key={s.hex}
              onClick={() => setBgColor(s.hex)}
              aria-label={`Card background ${s.hex}`}
              className="grid h-6 w-6 place-items-center rounded-md border border-black/10"
              style={{ background: s.hex }}
            >
              {bgColor === s.hex && (
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={s.check}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              )}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="rounded-full bg-[#2c2722] px-[19px] py-3 text-[13px] font-medium text-[#fbfaf8] hover:bg-[#463d35] disabled:cursor-default disabled:opacity-50"
          >
            {downloading ? "Preparing…" : "Download PNG"}
          </button>
          <button className="rounded-full border border-[#e2ded7] px-[19px] py-3 text-[13px] font-medium text-[#5d554c] hover:bg-[#f4f1ec]">
            Copy link
          </button>
          <button
            onClick={() => setHideNumbers((v) => !v)}
            className="rounded-full border border-[#e2ded7] px-[19px] py-3 text-[13px] font-medium text-[#5d554c] hover:bg-[#f4f1ec]"
          >
            {hideNumbers ? "Show the numbers" : "Hide the numbers"}
          </button>
        </div>
      </div>
    </div>
  );
}
