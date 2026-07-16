/**
 * 데모 데이터 생성기.
 *
 * TOSS_CLIENT_SECRET이 없거나 API가 실패할 때 화면이 비지 않도록
 * 심볼 문자열 해시 기반의 **결정적** 예시 데이터를 만든다.
 * 모든 페이로드에 isDemo: true가 붙고 UI는 "예시 데이터" 배지를 표시한다.
 */

import type { PeriodReturns } from "@/lib/market-v2/compute";
import { getSectorsByMarket, type MarketId, type SectorDefinition } from "@/lib/market-v2/sectors";
import type {
  HeatmapPayload,
  MarketOverviewPayload,
  RankingKind,
  RankingsPayload,
  SectorDetailPayload,
} from "@/lib/market-v2/view-types";

/** FNV-1a 해시 — 심볼별 고정 시드 */
function hashSeed(input: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** [0, 1) 범위 결정적 의사난수 */
function unitRandom(seed: string): number {
  return hashSeed(seed) / 0x100000000;
}

/** [-limit, +limit] 범위 결정적 수익률 */
function demoRate(seed: string, limit: number): number {
  return (unitRandom(seed) * 2 - 1) * limit;
}

function demoReturns(symbol: string): PeriodReturns {
  return {
    "1d": demoRate(`${symbol}:1d`, 0.035),
    "1w": demoRate(`${symbol}:1w`, 0.06),
    "1mo": demoRate(`${symbol}:1mo`, 0.12),
    "3mo": demoRate(`${symbol}:3mo`, 0.25),
  };
}

function demoPrice(symbol: string, currency: "KRW" | "USD"): number {
  const unit = unitRandom(`${symbol}:price`);
  if (currency === "USD") {
    return Math.round((20 + unit * 480) * 100) / 100;
  }
  return Math.round((8_000 + unit * 292_000) / 100) * 100;
}

const DEMO_GENERATED_AT = "demo";

export function buildDemoHeatmap(market: MarketId): HeatmapPayload {
  return {
    market,
    generatedAt: DEMO_GENERATED_AT,
    isDemo: true,
    tiles: getSectorsByMarket(market).map((sector) => ({
      market: sector.market,
      slug: sector.slug,
      name: sector.name,
      shortName: sector.shortName,
      etfSymbol: sector.etf.symbol,
      etfName: sector.etf.name,
      returns: demoReturns(sector.etf.symbol),
    })),
  };
}

export function buildDemoOverview(): MarketOverviewPayload {
  return {
    generatedAt: DEMO_GENERATED_AT,
    isDemo: true,
    indices: [
      { symbol: "KOSPI", label: "코스피", lastPrice: 2842.15, changeRate: demoRate("KOSPI:1d", 0.02) },
      { symbol: "KOSDAQ", label: "코스닥", lastPrice: 812.4, changeRate: demoRate("KOSDAQ:1d", 0.025) },
    ],
    usdKrw: { rate: 1372.5, changeType: "UP" },
    bond10y: 3.12,
    krBusinessDay: true,
    usBusinessDay: true,
    investorFlows: (["KOSPI", "KOSDAQ"] as const).map((market) => ({
      market,
      date: null,
      individualNet: Math.round(demoRate(`${market}:ind`, 1) * 4e11),
      foreignerNet: Math.round(demoRate(`${market}:for`, 1) * 5e11),
      institutionNet: Math.round(demoRate(`${market}:ins`, 1) * 3e11),
    })),
  };
}

const DEMO_RANKING_POOL: Record<MarketId, Array<{ symbol: string; name: string }>> = {
  KR: [
    { symbol: "005930", name: "삼성전자" },
    { symbol: "000660", name: "SK하이닉스" },
    { symbol: "373220", name: "LG에너지솔루션" },
    { symbol: "207940", name: "삼성바이오로직스" },
    { symbol: "005380", name: "현대차" },
    { symbol: "012450", name: "한화에어로스페이스" },
    { symbol: "105560", name: "KB금융" },
    { symbol: "035420", name: "NAVER" },
    { symbol: "042660", name: "한화오션" },
    { symbol: "068270", name: "셀트리온" },
  ],
  US: [
    { symbol: "NVDA", name: "NVIDIA" },
    { symbol: "AAPL", name: "Apple" },
    { symbol: "MSFT", name: "Microsoft" },
    { symbol: "AMZN", name: "Amazon" },
    { symbol: "TSLA", name: "Tesla" },
    { symbol: "META", name: "Meta Platforms" },
    { symbol: "GOOGL", name: "Alphabet A" },
    { symbol: "LLY", name: "Eli Lilly" },
    { symbol: "JPM", name: "JPMorgan Chase" },
    { symbol: "XOM", name: "Exxon Mobil" },
  ],
};

export function buildDemoRankings(market: MarketId, kind: RankingKind): RankingsPayload {
  const currency = market === "KR" ? "KRW" : "USD";
  const pool = DEMO_RANKING_POOL[market];

  const rows = pool
    .map((stock) => {
      const raw = demoRate(`${stock.symbol}:${kind}`, kind === "amount" ? 0.04 : 0.12);
      const changeRate = kind === "gainers" ? Math.abs(raw) : kind === "losers" ? -Math.abs(raw) : raw;
      return {
        symbol: stock.symbol,
        name: stock.name,
        lastPrice: demoPrice(stock.symbol, currency),
        changeRate,
        tradingAmount: Math.round(unitRandom(`${stock.symbol}:amt`) * 2e12),
        currency,
      };
    })
    .sort((a, b) =>
      kind === "amount"
        ? (b.tradingAmount ?? 0) - (a.tradingAmount ?? 0)
        : kind === "gainers"
          ? (b.changeRate ?? 0) - (a.changeRate ?? 0)
          : (a.changeRate ?? 0) - (b.changeRate ?? 0),
    )
    .map((row, index) => ({ ...row, rank: index + 1 }));

  return { market, kind, generatedAt: DEMO_GENERATED_AT, isDemo: true, rows };
}

export function buildDemoSectorDetail(sector: SectorDefinition): SectorDetailPayload {
  const currency = sector.market === "KR" ? "KRW" : "USD";

  return {
    market: sector.market,
    slug: sector.slug,
    name: sector.name,
    generatedAt: DEMO_GENERATED_AT,
    isDemo: true,
    etf: {
      symbol: sector.etf.symbol,
      name: sector.etf.name,
      lastPrice: demoPrice(sector.etf.symbol, currency),
      currency,
      returns: demoReturns(sector.etf.symbol),
    },
    constituents: sector.constituents
      .map((stock) => {
        const lastPrice = demoPrice(stock.symbol, currency);
        const capUnit = unitRandom(`${stock.symbol}:cap`);
        const marketCap =
          currency === "USD" ? Math.round((30 + capUnit * 3200) * 1e9) : Math.round((1 + capUnit * 450) * 1e12) / 10;
        return {
          symbol: stock.symbol,
          name: stock.name,
          lastPrice,
          changeRate: demoRate(`${stock.symbol}:1d`, 0.045),
          marketCap,
          currency,
        };
      })
      .sort((a, b) => (b.marketCap ?? 0) - (a.marketCap ?? 0)),
  };
}
