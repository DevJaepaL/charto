import type { CandleInterval, CandleRange, TechnicalResponse } from "@/lib/types";

export const ANALYSIS_DEFAULT_INTERVAL: CandleInterval = "1d";
export const ANALYSIS_DEFAULT_RANGE: CandleRange = "1y";
export const RECOMMENDATION_INTERVAL: CandleInterval = "1d";
export const RECOMMENDATION_RANGE: CandleRange = "1y";
export const ANALYSIS_DEMO_RETRY_DELAY_MS = 2_500;
export const ANALYSIS_DEMO_RETRY_LIMIT = 2;

export function getTechnicalCacheTtl(
  interval: CandleInterval,
  range: CandleRange,
  isDemo: boolean,
) {
  if (isDemo) {
    return 15_000;
  }

  if (interval.endsWith("m")) {
    return 30_000;
  }

  if (range === "max" || range === "5y" || range === "3y") {
    return 10 * 60_000;
  }

  return 2 * 60_000;
}

export function shouldReuseInitialTechnicalPayload(
  initialTechnicalPayload: TechnicalResponse | null,
  initialError: string | null,
) {
  return Boolean(initialTechnicalPayload && !initialError && !initialTechnicalPayload.isDemo);
}
