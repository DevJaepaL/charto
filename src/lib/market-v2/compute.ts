import type { TossCandle } from "@/lib/toss/types";

export type HeatmapPeriod = "1d" | "1w" | "1mo" | "3mo";

export const HEATMAP_PERIODS: Array<{ value: HeatmapPeriod; label: string }> = [
  { value: "1d", label: "1일" },
  { value: "1w", label: "1주" },
  { value: "1mo", label: "1개월" },
  { value: "3mo", label: "3개월" },
];

/** 기간별 거래일 오프셋 (마지막 봉 기준 몇 봉 전이 기준가인지) */
const PERIOD_OFFSETS: Record<HeatmapPeriod, number> = {
  "1d": 1,
  "1w": 5,
  "1mo": 21,
  "3mo": 63,
};

/** 히트맵에 필요한 최소 일봉 수 (3mo 오프셋 + 여유) */
export const HEATMAP_CANDLE_COUNT = 70;

export type PeriodReturns = Record<HeatmapPeriod, number | null>;

export function parseDecimal(value: string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/** 캔들을 시각 오름차순으로 정렬한 사본을 반환한다. */
export function sortCandlesAscending(candles: TossCandle[]): TossCandle[] {
  return [...candles].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );
}

/**
 * 일봉 목록에서 기간별 수익률(소수 비율)을 계산한다.
 * 마지막 봉의 종가를 현재가로 보고, 기간 오프셋 위치의 종가를 기준가로 삼는다.
 * 봉이 부족하거나 기준가가 0이면 해당 기간은 null.
 */
export function computePeriodReturns(candles: TossCandle[]): PeriodReturns {
  const sorted = sortCandlesAscending(candles);
  const last = sorted.length > 0 ? parseDecimal(sorted[sorted.length - 1].closePrice) : null;

  const returns: PeriodReturns = { "1d": null, "1w": null, "1mo": null, "3mo": null };

  if (last === null) {
    return returns;
  }

  for (const period of Object.keys(PERIOD_OFFSETS) as HeatmapPeriod[]) {
    const offset = PERIOD_OFFSETS[period];
    const baseIndex = sorted.length - 1 - offset;

    if (baseIndex < 0) {
      continue;
    }

    const base = parseDecimal(sorted[baseIndex].closePrice);
    if (base === null || base === 0) {
      continue;
    }

    returns[period] = (last - base) / base;
  }

  return returns;
}

/** 마지막 봉 종가와 직전 봉 종가 (현재가/전일 종가) */
export function latestQuoteFromCandles(candles: TossCandle[]): {
  lastPrice: number | null;
  previousClose: number | null;
  changeRate: number | null;
} {
  const sorted = sortCandlesAscending(candles);
  const lastPrice = sorted.length > 0 ? parseDecimal(sorted[sorted.length - 1].closePrice) : null;
  const previousClose = sorted.length > 1 ? parseDecimal(sorted[sorted.length - 2].closePrice) : null;

  const changeRate =
    lastPrice !== null && previousClose !== null && previousClose !== 0
      ? (lastPrice - previousClose) / previousClose
      : null;

  return { lastPrice, previousClose, changeRate };
}

export function computeMarketCap(lastPrice: number | null, sharesOutstanding: string | null | undefined): number | null {
  const shares = parseDecimal(sharesOutstanding ?? null);
  if (lastPrice === null || shares === null || shares <= 0) {
    return null;
  }
  return lastPrice * shares;
}

/** 시가총액 표기: KRW는 조/억, USD는 T/B 단위 */
export function formatMarketCap(value: number | null, currency: "KRW" | "USD" | (string & {})): string {
  if (value === null || !Number.isFinite(value) || value <= 0) {
    return "—";
  }

  if (currency === "USD") {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
    return `$${(value / 1e6).toFixed(0)}M`;
  }

  const jo = value / 1e12;
  if (jo >= 1) {
    return `${jo >= 100 ? jo.toFixed(0) : jo.toFixed(1)}조원`;
  }
  const eok = value / 1e8;
  return `${eok >= 100 ? Math.round(eok).toLocaleString("ko-KR") : eok.toFixed(0)}억원`;
}

export function formatPrice(value: number | null, currency: "KRW" | "USD" | (string & {})): string {
  if (value === null || !Number.isFinite(value)) {
    return "—";
  }

  if (currency === "USD") {
    return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

/** 등락률 표기: +1.25% / -0.80% */
export function formatChangeRate(rate: number | null): string {
  if (rate === null || !Number.isFinite(rate)) {
    return "—";
  }
  const percent = rate * 100;
  const sign = percent > 0 ? "+" : "";
  return `${sign}${percent.toFixed(2)}%`;
}

/** 원화 금액을 조/억 단위로 축약 (투자자 매매대금용) */
export function formatKrwCompact(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return "—";
  }

  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : value > 0 ? "+" : "";

  if (abs >= 1e12) {
    return `${sign}${(abs / 1e12).toFixed(2)}조원`;
  }
  return `${sign}${Math.round(abs / 1e8).toLocaleString("ko-KR")}억원`;
}
