import type { HeatmapPeriod, PeriodReturns } from "@/lib/market-v2/compute";
import type { MarketId } from "@/lib/market-v2/sectors";

export interface SectorHeatmapTile {
  market: MarketId;
  slug: string;
  name: string;
  shortName: string;
  etfSymbol: string;
  etfName: string;
  /** 기간별 수익률 (소수 비율). 시세 조회 실패 시 null */
  returns: PeriodReturns;
}

export interface HeatmapPayload {
  market: MarketId;
  generatedAt: string;
  isDemo: boolean;
  tiles: SectorHeatmapTile[];
}

export interface IndexQuote {
  symbol: string;
  label: string;
  lastPrice: number | null;
  changeRate: number | null;
}

export interface InvestorFlowSummary {
  market: "KOSPI" | "KOSDAQ";
  date: string | null;
  /** 순매수 = 매수 - 매도 (KRW) */
  individualNet: number | null;
  foreignerNet: number | null;
  institutionNet: number | null;
}

export interface MarketOverviewPayload {
  generatedAt: string;
  isDemo: boolean;
  indices: IndexQuote[];
  usdKrw: {
    rate: number | null;
    changeType: "UP" | "EQUAL" | "DOWN" | null;
  };
  bond10y: number | null;
  /** 오늘이 영업일인지 (세션 시간까지는 판단하지 않음) */
  krBusinessDay: boolean | null;
  usBusinessDay: boolean | null;
  investorFlows: InvestorFlowSummary[];
}

export type RankingKind = "gainers" | "losers" | "amount";

export interface RankingRow {
  rank: number;
  symbol: string;
  name: string;
  lastPrice: number | null;
  changeRate: number | null;
  tradingAmount: number | null;
  currency: "KRW" | "USD" | (string & {});
}

export interface RankingsPayload {
  market: MarketId;
  kind: RankingKind;
  generatedAt: string;
  isDemo: boolean;
  rows: RankingRow[];
}

export interface SectorConstituentRow {
  symbol: string;
  name: string;
  lastPrice: number | null;
  changeRate: number | null;
  marketCap: number | null;
  currency: "KRW" | "USD" | (string & {});
}

export interface SectorDetailPayload {
  market: MarketId;
  slug: string;
  name: string;
  generatedAt: string;
  isDemo: boolean;
  etf: {
    symbol: string;
    name: string;
    lastPrice: number | null;
    currency: "KRW" | "USD" | (string & {});
    returns: PeriodReturns;
  };
  constituents: SectorConstituentRow[];
}

export type { HeatmapPeriod, PeriodReturns, MarketId };
