import { describe, expect, it } from "vitest";

import {
  computeMarketCap,
  computePeriodReturns,
  formatChangeRate,
  formatKrwCompact,
  formatMarketCap,
  formatPrice,
  latestQuoteFromCandles,
  parseDecimal,
} from "@/lib/market-v2/compute";
import type { TossCandle } from "@/lib/toss/types";

function makeCandles(closes: number[]): TossCandle[] {
  // 최신순(내림차순)으로 넘겨 정렬 로직까지 함께 검증한다
  return closes
    .map((close, index) => ({
      timestamp: new Date(Date.UTC(2026, 0, 1 + index)).toISOString(),
      openPrice: String(close),
      highPrice: String(close),
      lowPrice: String(close),
      closePrice: String(close),
      volume: "1000",
      currency: "KRW" as const,
    }))
    .reverse();
}

describe("parseDecimal", () => {
  it("문자열 decimal을 숫자로 파싱한다", () => {
    expect(parseDecimal("72000")).toBe(72000);
    expect(parseDecimal("0.0125")).toBe(0.0125);
    expect(parseDecimal("-1.5")).toBe(-1.5);
  });

  it("빈 값과 비정상 값은 null", () => {
    expect(parseDecimal(null)).toBeNull();
    expect(parseDecimal(undefined)).toBeNull();
    expect(parseDecimal("")).toBeNull();
    expect(parseDecimal("abc")).toBeNull();
  });
});

describe("computePeriodReturns", () => {
  it("기간별 수익률을 마지막 종가 기준으로 계산한다", () => {
    // 70개 봉: 종가 100 → 169 (하루 +1)
    const closes = Array.from({ length: 70 }, (_, index) => 100 + index);
    const returns = computePeriodReturns(makeCandles(closes));

    expect(returns["1d"]).toBeCloseTo((169 - 168) / 168, 10);
    expect(returns["1w"]).toBeCloseTo((169 - 164) / 164, 10);
    expect(returns["1mo"]).toBeCloseTo((169 - 148) / 148, 10);
    expect(returns["3mo"]).toBeCloseTo((169 - 106) / 106, 10);
  });

  it("봉이 부족한 기간은 null", () => {
    const returns = computePeriodReturns(makeCandles([100, 102, 104]));

    expect(returns["1d"]).toBeCloseTo((104 - 102) / 102, 10);
    expect(returns["1w"]).toBeNull();
    expect(returns["1mo"]).toBeNull();
    expect(returns["3mo"]).toBeNull();
  });

  it("빈 배열이면 전부 null", () => {
    const returns = computePeriodReturns([]);
    expect(Object.values(returns).every((value) => value === null)).toBe(true);
  });

  it("기준가 0이면 해당 기간은 null", () => {
    const returns = computePeriodReturns(makeCandles([0, 100]));
    expect(returns["1d"]).toBeNull();
  });
});

describe("latestQuoteFromCandles", () => {
  it("현재가·전일 종가·등락률을 계산한다", () => {
    const quote = latestQuoteFromCandles(makeCandles([100, 110]));
    expect(quote.lastPrice).toBe(110);
    expect(quote.previousClose).toBe(100);
    expect(quote.changeRate).toBeCloseTo(0.1, 10);
  });

  it("봉 1개면 등락률은 null", () => {
    const quote = latestQuoteFromCandles(makeCandles([100]));
    expect(quote.lastPrice).toBe(100);
    expect(quote.changeRate).toBeNull();
  });
});

describe("computeMarketCap", () => {
  it("현재가 × 발행주식수", () => {
    expect(computeMarketCap(72000, "5919637922")).toBeCloseTo(72000 * 5919637922, 0);
  });

  it("입력이 없으면 null", () => {
    expect(computeMarketCap(null, "100")).toBeNull();
    expect(computeMarketCap(100, null)).toBeNull();
    expect(computeMarketCap(100, "0")).toBeNull();
  });
});

describe("포맷터", () => {
  it("시가총액 KRW 조/억", () => {
    expect(formatMarketCap(426e12, "KRW")).toBe("426조원");
    expect(formatMarketCap(1.5e12, "KRW")).toBe("1.5조원");
    expect(formatMarketCap(5e10, "KRW")).toBe("500억원");
    expect(formatMarketCap(null, "KRW")).toBe("—");
  });

  it("시가총액 USD T/B", () => {
    expect(formatMarketCap(3.2e12, "USD")).toBe("$3.20T");
    expect(formatMarketCap(4.5e10, "USD")).toBe("$45.0B");
  });

  it("가격 표기", () => {
    expect(formatPrice(72000, "KRW")).toBe("72,000원");
    expect(formatPrice(231.5, "USD")).toBe("$231.50");
    expect(formatPrice(null, "KRW")).toBe("—");
  });

  it("등락률 표기", () => {
    expect(formatChangeRate(0.0125)).toBe("+1.25%");
    expect(formatChangeRate(-0.008)).toBe("-0.80%");
    expect(formatChangeRate(0)).toBe("0.00%");
    expect(formatChangeRate(null)).toBe("—");
  });

  it("원화 축약 표기", () => {
    expect(formatKrwCompact(1.23e12)).toBe("+1.23조원");
    expect(formatKrwCompact(-3.5e10)).toBe("-350억원");
    expect(formatKrwCompact(null)).toBe("—");
  });
});
