import { tossGet } from "@/lib/toss/client";
import type {
  TossCandlePage,
  TossExchangeRate,
  TossInvestorTradingResponse,
  TossMarketCalendarResponse,
  TossMarketCountry,
  TossMarketIndicatorPrice,
  TossPrice,
  TossRankingDuration,
  TossRankingResponse,
  TossRankingType,
  TossStockInfo,
} from "@/lib/toss/types";

/** 현재가 조회 (최대 200 심볼) */
export function getPrices(symbols: string[]) {
  return tossGet<TossPrice[]>("/api/v1/prices", {
    group: "MARKET_DATA",
    searchParams: { symbols: symbols.join(",") },
  });
}

/** 일봉/분봉 캔들 조회 (최대 200봉, 수정주가 적용) */
export function getDailyCandles(symbol: string, count: number) {
  return tossGet<TossCandlePage>("/api/v1/candles", {
    group: "MARKET_DATA_CHART",
    searchParams: { symbol, interval: "1d", count, adjusted: true },
  });
}

/** 종목 마스터 조회 (최대 200 심볼) */
export function getStocks(symbols: string[]) {
  return tossGet<TossStockInfo[]>("/api/v1/stocks", {
    group: "STOCK",
    searchParams: { symbols: symbols.join(",") },
  });
}

export function getRankings(params: {
  type: TossRankingType;
  marketCountry: TossMarketCountry;
  duration: TossRankingDuration;
  count?: number;
}) {
  return tossGet<TossRankingResponse>("/api/v1/rankings", {
    group: "RANKING",
    searchParams: {
      type: params.type,
      marketCountry: params.marketCountry,
      duration: params.duration,
      count: params.count ?? 10,
      excludeInvestmentCaution: true,
    },
  });
}

/** 시장 지표 현재가 (KOSPI, KOSDAQ, KR_BOND_*) */
export function getMarketIndicatorPrices(symbols: string[]) {
  return tossGet<TossMarketIndicatorPrice[]>("/api/v1/market-indicators/prices", {
    group: "MARKET_INDICATOR",
    searchParams: { symbols: symbols.join(",") },
  });
}

export function getMarketIndicatorDailyCandles(symbol: string, count: number) {
  return tossGet<TossCandlePage>(`/api/v1/market-indicators/${encodeURIComponent(symbol)}/candles`, {
    group: "MARKET_INDICATOR",
    searchParams: { interval: "1d", count },
  });
}

/** KRX 투자자별 매매대금 (KOSPI/KOSDAQ, 일별 최신 1건) */
export function getInvestorTrading(symbol: "KOSPI" | "KOSDAQ", count = 1) {
  return tossGet<TossInvestorTradingResponse>(
    `/api/v1/market-indicators/${symbol}/investor-trading`,
    { group: "MARKET_INDICATOR", searchParams: { interval: "1d", count } },
  );
}

export function getUsdKrwRate() {
  return tossGet<TossExchangeRate>("/api/v1/exchange-rate", {
    group: "MARKET_INFO",
    searchParams: { baseCurrency: "USD", quoteCurrency: "KRW" },
  });
}

export function getMarketCalendar(market: TossMarketCountry) {
  return tossGet<TossMarketCalendarResponse>(`/api/v1/market-calendar/${market}`, {
    group: "MARKET_INFO",
  });
}
