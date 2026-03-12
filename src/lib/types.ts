export type MarketName = "KOSPI" | "KOSDAQ" | "KONEX";
export type InstrumentKind = "stock" | "etf" | "etn";
export type ContextConfidence = "high" | "medium" | "low";

export type CandleInterval = "1m" | "5m" | "15m" | "60m" | "1d" | "1w";

export type CandleRange = "1d" | "1w" | "1mo" | "3mo" | "6mo" | "1y" | "3y" | "5y" | "max";

export type SignalBias = "bullish" | "neutral" | "bearish";

export type ProviderId = "kis" | "demo";

export type MarketRankMode = "volume" | "value" | "marketCap";

export interface StockLookupItem {
  symbol: string;
  isin: string;
  name: string;
  market: MarketName;
}

export interface InstrumentProfile {
  kind: InstrumentKind;
  label: string;
  isExchangeTradedProduct: boolean;
  isDirectionalProduct: boolean;
}

export interface CompanyContext {
  group: string | null;
  instrumentLabel: string;
  sector: string;
  businessSummary: string;
  industryFlow: string;
  marketPosition: string;
  confidence: ContextConfidence;
  interpretWithCaution: boolean;
  cautionNote: string | null;
}

export interface Candle {
  time: number;
  label: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface QuoteSnapshot {
  currentPrice: number;
  previousClose: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  volume: number;
}

export interface TechnicalSnapshot {
  currentPrice: number;
  change: number;
  changePercent: number;
  sma5: number | null;
  sma20: number | null;
  sma60: number | null;
  ema20: number | null;
  rsi14: number | null;
  macd: number | null;
  macdSignal: number | null;
  macdHistogram: number | null;
  bollingerUpper: number | null;
  bollingerMiddle: number | null;
  bollingerLower: number | null;
  bollingerPosition: number | null;
  volumeAverage20: number | null;
  volumeStatus: string;
  support: number | null;
  resistance: number | null;
}

export interface SignalSummary {
  bias: SignalBias;
  score: number;
  previousScore?: number | null;
  scoreDelta?: number | null;
  reasons: string[];
  risks: string[];
  support: number | null;
  resistance: number | null;
}

export interface AiSummary {
  available: boolean;
  model?: string;
  reason?: string;
  trend?: string;
  momentum?: string;
  levels?: string;
  business?: string;
  risk?: string;
  conclusion?: string;
  disclaimer: string;
  rawText?: string;
}

export interface CandlesResponse {
  stock: StockLookupItem;
  interval: CandleInterval;
  range: CandleRange;
  provider: ProviderId;
  isDemo: boolean;
  chartUnavailable?: boolean;
  notice?: string;
  candles: Candle[];
  quote: QuoteSnapshot;
}

export interface TechnicalResponse extends CandlesResponse {
  companyContext: CompanyContext;
  technical: TechnicalSnapshot;
  signal: SignalSummary;
}

export interface MarketRankItem {
  rank: number;
  stock: StockLookupItem;
  price: number;
  changePercent: number;
  volume: number;
  tradeValue: number;
  marketCap?: number | null;
}

export interface MarketRankingResponse {
  mode: MarketRankMode;
  label: string;
  source: ProviderId;
  items: MarketRankItem[];
}
