import { describe, expect, it } from "vitest";

import {
  ANALYSIS_DEFAULT_RANGE,
  getTechnicalCacheTtl,
  shouldReuseInitialTechnicalPayload,
} from "@/lib/analysis/technical-request-policy";
import type { TechnicalResponse } from "@/lib/types";

function buildTechnicalResponse(isDemo: boolean): TechnicalResponse {
  return {
    stock: {
      symbol: "005930",
      isin: "KR7005930003",
      name: "삼성전자",
      market: "KOSPI",
    },
    interval: "1d",
    range: ANALYSIS_DEFAULT_RANGE,
    provider: isDemo ? "demo" : "kis",
    isDemo,
    candles: [],
    quote: {
      currentPrice: 0,
      previousClose: 0,
      change: 0,
      changePercent: 0,
      open: 0,
      high: 0,
      low: 0,
      volume: 0,
    },
    companyContext: {
      group: null,
      instrumentLabel: "보통주",
      sector: "반도체",
      businessSummary: "테스트",
      industryFlow: "테스트",
      marketPosition: "테스트",
      confidence: "high",
      interpretWithCaution: false,
      cautionNote: null,
    },
    earningsContext: null,
    technical: {
      currentPrice: 0,
      change: 0,
      changePercent: 0,
      sma5: null,
      sma20: null,
      sma60: null,
      ema20: null,
      rsi14: null,
      macd: null,
      macdSignal: null,
      macdHistogram: null,
      bollingerUpper: null,
      bollingerMiddle: null,
      bollingerLower: null,
      bollingerPosition: null,
      volumeAverage20: null,
      volumeStatus: "보통",
      support: null,
      resistance: null,
    },
    signal: {
      bias: "neutral",
      score: 0,
      reasons: [],
      risks: [],
      support: null,
      resistance: null,
    },
  };
}

describe("technical request policy", () => {
  it("keeps demo cache ttl very short", () => {
    expect(getTechnicalCacheTtl("1d", "max", true)).toBe(15_000);
    expect(getTechnicalCacheTtl("1d", "max", false)).toBe(10 * 60_000);
  });

  it("does not reuse demo payload as stable initial data", () => {
    expect(shouldReuseInitialTechnicalPayload(buildTechnicalResponse(false), null)).toBe(true);
    expect(shouldReuseInitialTechnicalPayload(buildTechnicalResponse(true), null)).toBe(false);
    expect(shouldReuseInitialTechnicalPayload(buildTechnicalResponse(false), "error")).toBe(false);
  });
});
