import { describe, expect, it } from "vitest";

import { buildTechnicalAnalysis } from "@/lib/analysis/technical";
import type { Candle, QuoteSnapshot } from "@/lib/types";

function buildUptrendCandles(): Candle[] {
  return Array.from({ length: 90 }, (_, index) => {
    const close = 10000 + index * 120;
    return {
      time: 1_700_000_000 + index * 86_400,
      label: `${index}`,
      open: close - 40,
      high: close + 90,
      low: close - 80,
      close,
      volume: 100_000 + index * 500,
    };
  });
}

function buildStock(name: string) {
  return {
    symbol: "000000",
    isin: "KR7000000000",
    name,
    market: "KOSPI" as const,
  };
}

describe("buildTechnicalAnalysis", () => {
  it("returns a bullish bias for a clean uptrend", () => {
    const candles = buildUptrendCandles();
    const latest = candles.at(-1)!;
    const previous = candles.at(-2)!;
    const quote: QuoteSnapshot = {
      currentPrice: latest.close,
      previousClose: previous.close,
      change: latest.close - previous.close,
      changePercent: ((latest.close - previous.close) / previous.close) * 100,
      open: latest.open,
      high: latest.high,
      low: latest.low,
      volume: latest.volume,
    };

    const result = buildTechnicalAnalysis(candles, quote, buildStock("삼성전자"));

    expect(result.signal.bias).toBe("bullish");
    expect(result.technical.sma5).not.toBeNull();
    expect(result.technical.sma20).not.toBeNull();
    expect(result.technical.sma60).not.toBeNull();
    expect(result.technical.rsi14).not.toBeNull();
    expect(result.signal.reasons.length).toBeGreaterThan(2);
    expect(result.signal.previousScore).not.toBeNull();
    expect(result.signal.scoreDelta).not.toBeNull();
  });

  it("dampens recommendation scores for directional ETFs", () => {
    const candles = buildUptrendCandles();
    const latest = candles.at(-1)!;
    const previous = candles.at(-2)!;
    const quote: QuoteSnapshot = {
      currentPrice: latest.close,
      previousClose: previous.close,
      change: latest.close - previous.close,
      changePercent: ((latest.close - previous.close) / previous.close) * 100,
      open: latest.open,
      high: latest.high,
      low: latest.low,
      volume: latest.volume,
    };

    const result = buildTechnicalAnalysis(candles, quote, buildStock("KODEX 200 인버스"));

    expect(result.signal.score).toBeLessThan(30);
    expect(result.signal.risks[0]).toContain("ETF");
  });
});
