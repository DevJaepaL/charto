/**
 * 토스증권 Open API 응답 타입.
 * 스펙: https://openapi.tossinvest.com/openapi-docs/latest/openapi.json
 * 모든 decimal 값은 문자열로 내려온다.
 */

export type TossCurrency = "KRW" | "USD" | (string & {});

export type TossMarketCountry = "KR" | "US";

export interface TossOAuth2TokenResponse {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
}

export interface TossPrice {
  symbol: string;
  timestamp: string | null;
  lastPrice: string;
  currency: TossCurrency;
}

export interface TossCandle {
  timestamp: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  closePrice: string;
  volume: string;
  currency?: TossCurrency;
}

export interface TossCandlePage {
  candles: TossCandle[];
  nextBefore: string | null;
}

export type TossSecurityType =
  | "STOCK"
  | "FOREIGN_STOCK"
  | "DEPOSITARY_RECEIPT"
  | "INFRASTRUCTURE_FUND"
  | "REIT"
  | "ETF"
  | "FOREIGN_ETF"
  | "ETN"
  | "STOCK_WARRANTS";

export interface TossStockInfo {
  symbol: string;
  name: string;
  englishName: string;
  isinCode: string;
  market: "KOSPI" | "KOSDAQ" | "NYSE" | "NASDAQ" | "AMEX" | "KR_ETC" | "US_ETC";
  securityType: TossSecurityType;
  isCommonShare: boolean;
  status: "SCHEDULED" | "ACTIVE" | "DELISTED";
  currency: TossCurrency;
  listDate: string | null;
  sharesOutstanding: string;
  leverageFactor: string | null;
}

export type TossRankingType =
  | "MARKET_TRADING_AMOUNT"
  | "MARKET_TRADING_VOLUME"
  | "TOP_GAINERS"
  | "TOP_LOSERS"
  | "TOSS_SECURITIES_TRADING_AMOUNT"
  | "TOSS_SECURITIES_TRADING_VOLUME";

export type TossRankingDuration = "realtime" | "1d" | "1w" | "1mo" | "3mo" | "6mo" | "1y";

export interface TossRankingItem {
  rank: number;
  symbol: string;
  currency: TossCurrency;
  price: {
    lastPrice: string;
    basePrice: string;
    /** 소수 비율 (0.0125 = 1.25%). basePrice가 0이면 null */
    changeRate: string | null;
  };
  tradingVolume: string;
  tradingAmount: string;
}

export interface TossRankingResponse {
  rankedAt: string | null;
  rankings: TossRankingItem[];
}

export interface TossMarketIndicatorPrice {
  symbol: string;
  timestamp: string | null;
  lastPrice: string;
}

export interface TossExchangeRate {
  baseCurrency: TossCurrency;
  quoteCurrency: TossCurrency;
  rate: string;
  midRate: string;
  basisPoint: string;
  rateChangeType: "UP" | "EQUAL" | "DOWN";
  validFrom: string;
  validUntil: string;
}

export interface TossInvestorTradingAmount {
  buyAmount: string;
  sellAmount: string;
}

export interface TossInvestorTradingRecord {
  date: string;
  updatedAt: string;
  individual: TossInvestorTradingAmount;
  foreigner: TossInvestorTradingAmount;
  institution: TossInvestorTradingAmount & { breakdown?: unknown };
  otherCorporation: TossInvestorTradingAmount;
}

export interface TossInvestorTradingResponse {
  nextUntil: string | null;
  records: TossInvestorTradingRecord[];
}

export interface TossKrMarketDay {
  date: string;
  /** 거래 가능 시간 (KRX+NXT 통합). 휴장이면 null */
  integrated: { open?: string; close?: string; [key: string]: unknown } | null;
}

export interface TossUsMarketDay {
  date: string;
  dayMarket: Record<string, unknown> | null;
  preMarket: Record<string, unknown> | null;
  regularMarket: { open?: string; close?: string; [key: string]: unknown } | null;
  afterMarket: Record<string, unknown> | null;
}

export interface TossMarketCalendarResponse<Day = TossKrMarketDay | TossUsMarketDay> {
  today: Day;
  previousBusinessDay: Day;
  nextBusinessDay: Day;
}
