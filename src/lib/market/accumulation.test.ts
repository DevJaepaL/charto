import { describe, expect, it } from "vitest";

import { evaluateAccumulationCandidate } from "@/lib/market/accumulation";
import type { StockLookupItem } from "@/lib/types";

const stock: StockLookupItem = {
  symbol: "005930",
  isin: "KR7005930003",
  name: "삼성전자",
  market: "KOSPI",
};

describe("evaluateAccumulationCandidate", () => {
  it("keeps stocks with steady foreign and institution accumulation", () => {
    const result = evaluateAccumulationCandidate(stock, [
      {
        date: "20260402",
        close: 101_000,
        changePercent: 0.9,
        foreignNetBuyAmount: 1_400_000_000,
        institutionNetBuyAmount: 1_100_000_000,
      },
      {
        date: "20260401",
        close: 100_400,
        changePercent: -0.4,
        foreignNetBuyAmount: 900_000_000,
        institutionNetBuyAmount: 700_000_000,
      },
      {
        date: "20260331",
        close: 100_800,
        changePercent: 0.6,
        foreignNetBuyAmount: 1_100_000_000,
        institutionNetBuyAmount: 500_000_000,
      },
      {
        date: "20260330",
        close: 100_100,
        changePercent: -0.8,
        foreignNetBuyAmount: 500_000_000,
        institutionNetBuyAmount: 450_000_000,
      },
      {
        date: "20260327",
        close: 98_700,
        changePercent: 1.2,
        foreignNetBuyAmount: 750_000_000,
        institutionNetBuyAmount: 350_000_000,
      },
    ]);

    expect(result).not.toBeNull();
    expect(result?.positiveDays).toBe(5);
    expect(result?.combinedNetBuyAmount5d).toBe(7_750_000_000);
    expect(result?.priceChangePercent5d).toBeCloseTo(2.33, 2);
  });

  it("rejects stocks that already moved too sharply", () => {
    const result = evaluateAccumulationCandidate(stock, [
      {
        date: "20260402",
        close: 121_000,
        changePercent: 5.8,
        foreignNetBuyAmount: 1_400_000_000,
        institutionNetBuyAmount: 1_100_000_000,
      },
      {
        date: "20260401",
        close: 114_000,
        changePercent: 4.2,
        foreignNetBuyAmount: 1_000_000_000,
        institutionNetBuyAmount: 900_000_000,
      },
      {
        date: "20260331",
        close: 109_000,
        changePercent: 5.1,
        foreignNetBuyAmount: 800_000_000,
        institutionNetBuyAmount: 750_000_000,
      },
      {
        date: "20260330",
        close: 103_000,
        changePercent: 5.8,
        foreignNetBuyAmount: 900_000_000,
        institutionNetBuyAmount: 700_000_000,
      },
      {
        date: "20260327",
        close: 99_000,
        changePercent: 2.5,
        foreignNetBuyAmount: 700_000_000,
        institutionNetBuyAmount: 500_000_000,
      },
    ]);

    expect(result).toBeNull();
  });

  it("rejects stocks when institution buying does not persist", () => {
    const result = evaluateAccumulationCandidate(stock, [
      {
        date: "20260402",
        close: 101_000,
        changePercent: 0.9,
        foreignNetBuyAmount: 1_400_000_000,
        institutionNetBuyAmount: -1_100_000_000,
      },
      {
        date: "20260401",
        close: 100_400,
        changePercent: -0.4,
        foreignNetBuyAmount: 900_000_000,
        institutionNetBuyAmount: -700_000_000,
      },
      {
        date: "20260331",
        close: 100_800,
        changePercent: 0.6,
        foreignNetBuyAmount: 1_100_000_000,
        institutionNetBuyAmount: 500_000_000,
      },
      {
        date: "20260330",
        close: 100_100,
        changePercent: -0.8,
        foreignNetBuyAmount: 500_000_000,
        institutionNetBuyAmount: -450_000_000,
      },
      {
        date: "20260327",
        close: 98_700,
        changePercent: 1.2,
        foreignNetBuyAmount: 750_000_000,
        institutionNetBuyAmount: 350_000_000,
      },
    ]);

    expect(result).toBeNull();
  });
});
