import { describe, expect, it } from "vitest";

import { DemoMarketDataProvider } from "@/lib/market/demo-provider";
import {
  candlesQuerySchema,
  shouldPreferUnavailableChartFallback,
  supportsRealtimeKisSymbol,
} from "@/lib/market/provider";

describe("market provider", () => {
  it("accepts alphanumeric stock symbols in the query schema", () => {
    const parsed = candlesQuerySchema.parse({
      symbol: "0120g0",
      interval: "1m",
      range: "max",
    });

    expect(parsed.symbol).toBe("0120G0");
    expect(parsed.interval).toBe("1m");
    expect(parsed.range).toBe("max");
  });

  it("marks only 6-digit numeric symbols as realtime-kis eligible", () => {
    expect(supportsRealtimeKisSymbol("005930")).toBe(true);
    expect(supportsRealtimeKisSymbol("0120G0")).toBe(false);
  });

  it("builds finite demo candles for alphanumeric symbols", async () => {
    const provider = new DemoMarketDataProvider();
    const payload = await provider.getCandles("0120G0", "1d", "3mo");

    expect(Number.isFinite(payload.quote.currentPrice)).toBe(true);
    expect(payload.candles.length).toBeGreaterThan(10);
    expect(Number.isFinite(payload.candles[0]?.close)).toBe(true);
  });

  it("marks commodity futures leveraged etps as chart-unavailable fallback targets", () => {
    expect(shouldPreferUnavailableChartFallback("Q580068")).toBe(true);
    expect(shouldPreferUnavailableChartFallback("005930")).toBe(false);
    expect(shouldPreferUnavailableChartFallback("152500")).toBe(false);
  });
});
