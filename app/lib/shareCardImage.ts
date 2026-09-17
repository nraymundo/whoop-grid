import { DailyMetrics } from "./types";
import { band, BAND_COLOR } from "./stats";

const WIDTH = 1200;
// Supersample so text and grid-cell edges stay crisp instead of the soft,
// anti-aliased look you get rendering flat shapes at exactly 1x.
const SCALE = 2;

// Mirrors the on-screen card's spacing: the colored backdrop uses p-[50px]
// (OUTER_PAD) and the white card inside it uses p-[26px] (INNER_PAD). The
// on-screen card's height is whatever its content needs (flow layout) — the
// canvas has to compute that explicitly, or it ends up with a fixed height
// taller than the actual content and shows extra blank space at the bottom.
const OUTER_PAD = 50;
const INNER_PAD = 26;
const GRID_CELL_PAD = 8; // matches ShareCardGrid's p-2
const GRID_GAP = 2;
const TITLE_BLOCK_H = 40; // title row + its bottom margin (mb-5)
const GRID_MARGIN_BOTTOM = 20; // ShareCardGrid's own mb-5
const STATS_BLOCK_H = 48; // label + value text block

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export interface ShareCardStats {
  avgRecovery: number | string;
  greenDays: number | string;
  bestStreak: number | string;
}

export async function downloadShareCardPng(
  data: DailyMetrics[],
  hideNumbers: boolean,
  stats: ShareCardStats,
  bgColor: string = "#fbfaf8"
) {
  const cardX = OUTER_PAD;
  const cardY = OUTER_PAD;
  const cardW = WIDTH - OUTER_PAD * 2;
  const gridW = cardW - INNER_PAD * 2;

  // Cells are square, sized from the available width — matches ShareCardGrid,
  // which does the same instead of stretching cells to a fixed height.
  const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));
  const firstWeekday =
    sorted.length > 0 ? new Date(sorted[0].date + "T00:00:00").getDay() : 0;
  const weekCount =
    sorted.length > 0
      ? Math.floor((firstWeekday + sorted.length - 1) / 7) + 1
      : 1;
  const cellSize = Math.max(
    2,
    (gridW - GRID_CELL_PAD * 2 - GRID_GAP * (weekCount - 1)) / weekCount
  );
  const gridH = GRID_CELL_PAD * 2 + cellSize * 7 + GRID_GAP * 6;

  const contentH =
    TITLE_BLOCK_H +
    gridH +
    (hideNumbers ? 0 : GRID_MARGIN_BOTTOM + STATS_BLOCK_H);
  const cardH = INNER_PAD * 2 + contentH;
  const HEIGHT = cardY + cardH + OUTER_PAD;

  const canvas = document.createElement("canvas");
  canvas.width = WIDTH * SCALE;
  canvas.height = HEIGHT * SCALE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.scale(SCALE, SCALE);

  try {
    await document.fonts.ready;
  } catch {
    // Font loading API unsupported — fall back to default font metrics.
  }

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = "#ffffff";
  roundRect(ctx, cardX, cardY, cardW, cardH, 20);
  ctx.fill();
  ctx.strokeStyle = "#edeae4";
  ctx.lineWidth = 1;
  roundRect(ctx, cardX, cardY, cardW, cardH, 20);
  ctx.stroke();

  const contentX = cardX + INNER_PAD;
  const titleY = cardY + INNER_PAD + 14;
  ctx.fillStyle = "#2c2722";
  ctx.font = "600 22px 'IBM Plex Sans', sans-serif";
  ctx.fillText("Whoopty", contentX, titleY);
  const titleWidth = ctx.measureText("Whoopty").width;

  ctx.fillStyle = "#665e54";
  ctx.font = "400 15px 'IBM Plex Mono', monospace";
  ctx.fillText("Sep 2025 – Sep 2026", contentX + titleWidth + 14, titleY);

  const gridX = contentX;
  const gridY = cardY + INNER_PAD + TITLE_BLOCK_H;

  ctx.fillStyle = "#f4f1ec";
  roundRect(ctx, gridX, gridY, gridW, gridH, 10);
  ctx.fill();

  if (sorted.length > 0) {
    const cells = sorted.map((d, i) => ({
      weekIndex: Math.floor((firstWeekday + i) / 7),
      weekday: (firstWeekday + i) % 7,
      color: BAND_COLOR[band(d.recovery, "recovery")],
    }));

    for (const c of cells) {
      // Round every edge to a whole (device) pixel — fractional coordinates
      // are what make flat-colored rects look blurry/anti-aliased.
      const x0 = Math.round((gridX + GRID_CELL_PAD + c.weekIndex * (cellSize + GRID_GAP)) * SCALE) / SCALE;
      const y0 = Math.round((gridY + GRID_CELL_PAD + c.weekday * (cellSize + GRID_GAP)) * SCALE) / SCALE;
      const x1 = Math.round((gridX + GRID_CELL_PAD + c.weekIndex * (cellSize + GRID_GAP) + cellSize) * SCALE) / SCALE;
      const y1 = Math.round((gridY + GRID_CELL_PAD + c.weekday * (cellSize + GRID_GAP) + cellSize) * SCALE) / SCALE;
      ctx.fillStyle = c.color;
      ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    }
  }

  if (!hideNumbers) {
    const statsY = gridY + gridH + GRID_MARGIN_BOTTOM + 14;
    const items = [
      { label: "Avg recovery", value: `${stats.avgRecovery}%` },
      { label: "Green days", value: `${stats.greenDays}` },
      { label: "Best streak", value: `${stats.bestStreak} d` },
    ];

    let x = gridX;
    for (const item of items) {
      ctx.fillStyle = "#665e54";
      ctx.font = "400 13px 'IBM Plex Sans', sans-serif";
      ctx.fillText(item.label, x, statsY);

      ctx.fillStyle = "#2c2722";
      ctx.font = "300 32px 'IBM Plex Sans', sans-serif";
      ctx.fillText(item.value, x, statsY + 36);

      x += 170;
    }

    ctx.fillStyle = "#665e54";
    ctx.font = "400 14px 'IBM Plex Mono', monospace";
    const watermark = "whoopgrid.app";
    const wmWidth = ctx.measureText(watermark).width;
    ctx.fillText(watermark, cardX + cardW - INNER_PAD - wmWidth, statsY);
  }

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/png")
  );
  if (!blob) return;

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "whoop-grid-card.png";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
