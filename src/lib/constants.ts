import type { CandleInterval, CandleRange } from "@/lib/types";

export const DEFAULT_SYMBOL = "005930";

export const FEATURED_SYMBOLS = [
  "005930",
  "000660",
  "035420",
  "005380",
  "373220",
  "207940",
] as const;

export const INTERVAL_OPTIONS: Array<{ value: CandleInterval; label: string }> = [
  { value: "1m", label: "1분" },
  { value: "5m", label: "5분" },
  { value: "15m", label: "15분" },
  { value: "60m", label: "60분" },
  { value: "1d", label: "일봉" },
  { value: "1w", label: "주봉" },
];

export const DAILY_RANGE_OPTIONS: Array<{ value: CandleRange; label: string }> = [
  { value: "max", label: "전체" },
  { value: "1mo", label: "1개월" },
  { value: "3mo", label: "3개월" },
  { value: "6mo", label: "6개월" },
  { value: "1y", label: "1년" },
  { value: "3y", label: "3년" },
  { value: "5y", label: "5년" },
];

export const INTRADAY_RANGE_OPTIONS: Array<{
  value: Extract<CandleRange, "1d" | "1w">;
  label: string;
}> = [
  { value: "1d", label: "1일" },
  { value: "1w", label: "1주" },
];

export const AI_DISCLAIMER =
  "이 분석은 기술적 지표를 바탕으로 한 참고 정보이며 투자 판단의 책임은 사용자에게 있습니다.";
