import type { SignalBias } from "@/lib/types";

export function formatNumber(value: number, options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat("ko-KR", options).format(value);
}

export function formatPrice(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "-";
  }

  return `${formatNumber(Math.round(value))}원`;
}

export function formatCompactNumber(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "-";
  }

  return new Intl.NumberFormat("ko-KR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatKoreanWon(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "-";
  }

  const absolute = Math.abs(value);

  if (absolute >= 1_0000_0000_0000) {
    return `${(value / 1_0000_0000_0000).toFixed(1).replace(/\.0$/, "")}조 원`;
  }

  if (absolute >= 1_0000_0000) {
    return `${(value / 1_0000_0000).toFixed(1).replace(/\.0$/, "")}억 원`;
  }

  if (absolute >= 1_0000) {
    return `${(value / 1_0000).toFixed(1).replace(/\.0$/, "")}만 원`;
  }

  return `${formatNumber(Math.round(value))}원`;
}

export function formatKoreanMarketCap(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "-";
  }

  const absolute = Math.abs(value);
  const sign = value < 0 ? "-" : "";

  if (absolute >= 10_000) {
    return `${sign}${(absolute / 10_000).toFixed(1).replace(/\.0$/, "")}조 원`;
  }

  return `${sign}${formatNumber(Math.round(absolute))}억 원`;
}

export function formatInteger(value: number | null | undefined, suffix = "") {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "-";
  }

  return `${formatNumber(Math.round(value))}${suffix}`;
}

export function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "-";
  }

  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function formatSignedPrice(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "-";
  }

  const sign = value > 0 ? "+" : "";
  return `${sign}${formatNumber(Math.round(value))}원`;
}

export function getBiasLabel(bias: SignalBias) {
  switch (bias) {
    case "bullish":
      return "상승 우위";
    case "bearish":
      return "하락 우위";
    default:
      return "중립";
  }
}

export function getBiasTone(bias: SignalBias) {
  switch (bias) {
    case "bullish":
      return "text-[var(--brand-strong)] bg-[var(--brand-soft)]";
    case "bearish":
      return "text-rose-600 bg-rose-100";
    default:
      return "text-slate-600 bg-slate-100";
  }
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function toKstLabel(timestamp: number) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(timestamp * 1000);
}

export function isIntradayInterval(interval: string) {
  return interval.endsWith("m");
}
