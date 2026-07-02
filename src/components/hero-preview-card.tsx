import { getBiasLabel, formatPercent, formatPrice } from "@/lib/utils";
import type { Candle, TechnicalResponse } from "@/lib/types";

function getBarClassName(tone: "up" | "down" | "muted") {
  switch (tone) {
    case "up":
      return "bg-[rgba(240,66,81,0.82)]";
    case "down":
      return "bg-[rgba(52,133,250,0.82)]";
    default:
      return "bg-[rgba(148,163,184,0.58)]";
  }
}

function buildMiniBars(candles: Candle[]) {
  const slice = candles.slice(-10);
  const lows = slice.map((item) => item.low);
  const highs = slice.map((item) => item.high);
  const min = Math.min(...lows);
  const max = Math.max(...highs);
  const range = max - min || 1;

  return slice.map((item) => ({
    height: `${Math.round(26 + ((item.close - min) / range) * 60)}%`,
    tone: (item.close > item.open ? "up" : item.close < item.open ? "down" : "muted") as
      | "up"
      | "down"
      | "muted",
  }));
}

function formatMiniDate(timestamp: number) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "numeric",
    day: "numeric",
  }).format(new Date(timestamp * 1000));
}

function getBiasChipClassName(bias: TechnicalResponse["signal"]["bias"]) {
  switch (bias) {
    case "bullish":
      return "bg-[rgba(240,66,81,0.14)] text-[var(--price-up)]";
    case "bearish":
      return "bg-[rgba(52,133,250,0.14)] text-[var(--price-down)]";
    default:
      return "bg-slate-200/75 text-slate-600 dark:bg-white/10 dark:text-slate-200";
  }
}

function getProgressClassName(bias: TechnicalResponse["signal"]["bias"]) {
  switch (bias) {
    case "bullish":
      return "bg-[var(--price-up)]";
    case "bearish":
      return "bg-[var(--price-down)]";
    default:
      return "bg-[var(--brand)]";
  }
}

export function HeroPreviewCard({ preview }: { preview: TechnicalResponse }) {
  const miniBars = buildMiniBars(preview.candles);
  const points = preview.signal.reasons.slice(0, 3);
  const chartLabels = [
    miniBars[0] ? formatMiniDate(preview.candles.at(-10)?.time ?? preview.candles[0].time) : "",
    miniBars[0]
      ? formatMiniDate(preview.candles.at(-5)?.time ?? preview.candles[Math.max(0, preview.candles.length - 5)].time)
      : "",
    miniBars[0] ? formatMiniDate(preview.candles.at(-1)?.time ?? preview.candles[preview.candles.length - 1].time) : "",
  ];
  const scoreWidth = `${Math.max(14, Math.min(100, Math.abs(preview.signal.score)))}%`;
  const scoreLabel = preview.signal.score > 0 ? `+${preview.signal.score}` : `${preview.signal.score}`;

  return (
    <div
      className="surface-card relative overflow-hidden rounded-[var(--radius-xl)] p-3 text-slate-900 dark:text-white"
      data-home-preview-card
    >
      <div className="relative">
        <div className="flex items-start justify-between gap-2">
          <div
            className="surface-pill inline-flex rounded-full px-2.5 py-0.75 text-[10px] font-semibold text-slate-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200"
            data-home-preview-pill
          >
            실시간 미리보기
          </div>
          <div
            className="max-w-[132px] truncate text-right text-[10px] font-medium text-slate-500 dark:text-slate-400"
            data-home-preview-pill
          >
            {preview.stock.symbol} · {preview.stock.name}
          </div>
        </div>

        <div className="mt-2.5 grid gap-2">
          <div
            className="surface-card rounded-[var(--radius-lg)] p-2.5 dark:border-white/8 dark:bg-white/[0.03]"
            data-home-preview-section
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                  최근 흐름
                </div>
                <div className="mt-1 text-[1rem] font-bold tracking-tight text-slate-900 dark:text-white">
                  {formatPrice(preview.quote.currentPrice)}
                </div>
              </div>
              <div
                className={`rounded-full px-2 py-0.75 text-[10px] font-bold ${getBiasChipClassName(
                  preview.signal.bias,
                )}`}
                data-home-preview-pill
              >
                {formatPercent(preview.quote.changePercent)}
              </div>
            </div>

            <div className="mt-3 flex h-24 items-end gap-1.25">
              {miniBars.map((bar, index) => (
                <span
                  key={`${bar.tone}-${index}`}
                  className={`origin-bottom w-full rounded-full ${getBarClassName(bar.tone)}`}
                  data-home-preview-bar
                  style={{ height: bar.height }}
                />
              ))}
            </div>

            <div className="mt-2.5 flex items-center justify-between text-[10px] font-medium text-slate-500 dark:text-slate-500">
              <span>{chartLabels[0]}</span>
              <span>{chartLabels[1]}</span>
              <span>{chartLabels[2]}</span>
            </div>
          </div>

          <div className="grid gap-2">
            <div
              className="surface-card rounded-[var(--radius-lg)] p-2.5 dark:border-white/8 dark:bg-white/[0.03]"
              data-home-preview-section
            >
              <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                차트 신호 점수
              </div>
              <div className="mt-1.5 flex flex-wrap items-end gap-1.5">
                <div className="text-[1.45rem] font-bold tracking-tight text-slate-900 dark:text-white">{scoreLabel}</div>
                <div
                  className={`mb-0.5 rounded-full px-2 py-0.75 text-[10px] font-bold ${getBiasChipClassName(
                    preview.signal.bias,
                  )}`}
                  data-home-preview-pill
                >
                  {getBiasLabel(preview.signal.bias)}
                </div>
              </div>
              <div className="mt-2.5 h-1.5 rounded-full bg-slate-200/80 dark:bg-white/10">
                <div
                  className={`h-1.5 origin-left rounded-full ${getProgressClassName(preview.signal.bias)}`}
                  data-home-preview-progress
                  style={{ width: scoreWidth }}
                />
              </div>
              <div className="mt-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                {preview.signal.reasons[0] ?? "핵심 지표를 확인 중입니다."}
              </div>
            </div>

            <div
              className="surface-card rounded-[var(--radius-lg)] p-2.5 dark:border-white/8 dark:bg-white/[0.03]"
              data-home-preview-section
            >
              <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                핵심 포인트
              </div>
              <ul className="mt-2.5 space-y-1.5 text-[11px] leading-4 text-slate-700 dark:text-slate-200">
                {points.map((point) => (
                  <li
                    key={point}
                    className="surface-pill rounded-full px-2.5 py-1.25 dark:border-white/10 dark:bg-white/[0.04]"
                    data-home-preview-point
                  >
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
