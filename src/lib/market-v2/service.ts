import {
  getDailyCandles,
  getInvestorTrading,
  getMarketCalendar,
  getMarketIndicatorDailyCandles,
  getMarketIndicatorPrices,
  getRankings,
  getStocks,
  getUsdKrwRate,
} from "@/lib/toss/api";
import { hasTossCredentials } from "@/lib/toss/client";
import type { TossKrMarketDay, TossRankingType, TossStockInfo, TossUsMarketDay } from "@/lib/toss/types";
import {
  computeMarketCap,
  computePeriodReturns,
  HEATMAP_CANDLE_COUNT,
  latestQuoteFromCandles,
  parseDecimal,
} from "@/lib/market-v2/compute";
import {
  buildDemoHeatmap,
  buildDemoOverview,
  buildDemoRankings,
  buildDemoSectorDetail,
} from "@/lib/market-v2/demo";
import { findSector, getSectorsByMarket, type MarketId, type SectorDefinition } from "@/lib/market-v2/sectors";
import type {
  HeatmapPayload,
  InvestorFlowSummary,
  MarketOverviewPayload,
  RankingKind,
  RankingsPayload,
  SectorDetailPayload,
  SectorHeatmapTile,
} from "@/lib/market-v2/view-types";

/**
 * 인메모리 TTL 캐시.
 * 만료 후에도 값을 지우지 않고 보관해서, 갱신 실패 시 stale 데이터로 응답한다.
 */
interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

async function cached<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (entry && entry.expiresAt > Date.now()) {
    return entry.value;
  }

  const running = inflight.get(key) as Promise<T> | undefined;
  if (running) {
    return running;
  }

  const request = loader()
    .then((value) => {
      cache.set(key, { value, expiresAt: Date.now() + ttlMs });
      return value;
    })
    .catch((error) => {
      if (entry) {
        // 갱신 실패 — stale 값으로 버틴다 (만료 연장으로 재시도 폭주 방지)
        cache.set(key, { value: entry.value, expiresAt: Date.now() + 30_000 });
        return entry.value;
      }
      throw error;
    })
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, request);
  return request;
}

const TTL = {
  heatmap: 5 * 60_000,
  overview: 3 * 60_000,
  rankings: 3 * 60_000,
  sectorDetail: 5 * 60_000,
  stockMaster: 24 * 60 * 60_000,
} as const;

async function settle<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await promise;
  } catch {
    return null;
  }
}

/**
 * 실패 시 잠시 대기 후 1회 재시도.
 * 히트맵처럼 수십 개를 연달아 부르는 경로는 순간적으로 레이트리밋(429)에
 * 걸릴 수 있어, 개별 항목이 조용히 비는 것을 줄인다.
 */
async function settleWithRetry<T>(load: () => Promise<T>, retryDelayMs = 1_500): Promise<T | null> {
  const first = await settle(load());
  if (first !== null) {
    return first;
  }

  await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
  return settle(load());
}

// ---------------------------------------------------------------------------
// 섹터 히트맵
// ---------------------------------------------------------------------------

async function loadSectorTile(sector: SectorDefinition): Promise<SectorHeatmapTile> {
  const page = await settleWithRetry(() => getDailyCandles(sector.etf.symbol, HEATMAP_CANDLE_COUNT));

  return {
    market: sector.market,
    slug: sector.slug,
    name: sector.name,
    shortName: sector.shortName,
    etfSymbol: sector.etf.symbol,
    etfName: sector.etf.name,
    returns: computePeriodReturns(page?.candles ?? []),
  };
}

export async function getSectorHeatmap(market: MarketId): Promise<HeatmapPayload> {
  if (!hasTossCredentials()) {
    return buildDemoHeatmap(market);
  }

  return cached(`heatmap:${market}`, TTL.heatmap, async () => {
    const sectors = getSectorsByMarket(market);
    // 스로틀은 클라이언트 계층이 담당하므로 순차 실행에 가깝게 흐른다
    const tiles = await Promise.all(sectors.map((sector) => loadSectorTile(sector)));

    const hasAnyData = tiles.some((tile) => tile.returns["1d"] !== null);
    if (!hasAnyData) {
      throw new Error(`히트맵 데이터 없음 (${market})`);
    }

    return {
      market,
      generatedAt: new Date().toISOString(),
      isDemo: false,
      tiles,
    } satisfies HeatmapPayload;
  }).catch(() => buildDemoHeatmap(market));
}

// ---------------------------------------------------------------------------
// 시장 개요 (지수·환율·금리·장 운영·투자자 동향)
// ---------------------------------------------------------------------------

function netAmount(amount: { buyAmount: string; sellAmount: string } | undefined): number | null {
  if (!amount) {
    return null;
  }
  const buy = parseDecimal(amount.buyAmount);
  const sell = parseDecimal(amount.sellAmount);
  if (buy === null || sell === null) {
    return null;
  }
  return buy - sell;
}

async function loadInvestorFlow(market: "KOSPI" | "KOSDAQ"): Promise<InvestorFlowSummary> {
  const response = await settle(getInvestorTrading(market));
  const record = response?.records?.[0];

  return {
    market,
    date: record?.date ?? null,
    individualNet: netAmount(record?.individual),
    foreignerNet: netAmount(record?.foreigner),
    institutionNet: netAmount(record?.institution),
  };
}

export async function getMarketOverview(): Promise<MarketOverviewPayload> {
  if (!hasTossCredentials()) {
    return buildDemoOverview();
  }

  return cached("overview", TTL.overview, async () => {
    const [kospiCandles, kosdaqCandles, indicatorPrices, fx, krCalendar, usCalendar, kospiFlow, kosdaqFlow] =
      await Promise.all([
        settle(getMarketIndicatorDailyCandles("KOSPI", 2)),
        settle(getMarketIndicatorDailyCandles("KOSDAQ", 2)),
        settle(getMarketIndicatorPrices(["KOSPI", "KOSDAQ", "KR_BOND_10Y"])),
        settle(getUsdKrwRate()),
        settle(getMarketCalendar("KR")),
        settle(getMarketCalendar("US")),
        loadInvestorFlow("KOSPI"),
        loadInvestorFlow("KOSDAQ"),
      ]);

    const indicatorMap = new Map((indicatorPrices ?? []).map((item) => [item.symbol, item]));

    const buildIndex = (symbol: "KOSPI" | "KOSDAQ", label: string, candles: typeof kospiCandles) => {
      const quote = latestQuoteFromCandles(candles?.candles ?? []);
      const livePrice = parseDecimal(indicatorMap.get(symbol)?.lastPrice ?? null);
      const lastPrice = livePrice ?? quote.lastPrice;
      const changeRate =
        livePrice !== null && quote.previousClose !== null && quote.previousClose !== 0
          ? (livePrice - quote.previousClose) / quote.previousClose
          : quote.changeRate;

      return { symbol, label, lastPrice, changeRate };
    };

    const krToday = krCalendar?.today as TossKrMarketDay | undefined;
    const usToday = usCalendar?.today as TossUsMarketDay | undefined;
    const todayIso = new Date().toISOString().slice(0, 10);

    const payload: MarketOverviewPayload = {
      generatedAt: new Date().toISOString(),
      isDemo: false,
      indices: [
        buildIndex("KOSPI", "코스피", kospiCandles),
        buildIndex("KOSDAQ", "코스닥", kosdaqCandles),
      ],
      usdKrw: {
        rate: parseDecimal(fx?.rate ?? null),
        changeType: fx?.rateChangeType ?? null,
      },
      bond10y: parseDecimal(indicatorMap.get("KR_BOND_10Y")?.lastPrice ?? null),
      krBusinessDay: krToday ? krToday.date === todayIso && krToday.integrated !== null : null,
      usBusinessDay: usToday ? usToday.regularMarket !== null : null,
      investorFlows: [kospiFlow, kosdaqFlow],
    };

    const hasAnyData =
      payload.indices.some((index) => index.lastPrice !== null) || payload.usdKrw.rate !== null;
    if (!hasAnyData) {
      throw new Error("시장 개요 데이터 없음");
    }

    return payload;
  }).catch(() => buildDemoOverview());
}

// ---------------------------------------------------------------------------
// 랭킹
// ---------------------------------------------------------------------------

const RANKING_TYPE_BY_KIND: Record<RankingKind, TossRankingType> = {
  gainers: "TOP_GAINERS",
  losers: "TOP_LOSERS",
  amount: "MARKET_TRADING_AMOUNT",
};

async function loadStockNames(symbols: string[]): Promise<Map<string, TossStockInfo>> {
  if (symbols.length === 0) {
    return new Map();
  }

  const key = `stocks:${[...symbols].sort().join(",")}`;
  const stocks = await cached(key, TTL.stockMaster, () => getStocks(symbols));
  return new Map(stocks.map((stock) => [stock.symbol, stock]));
}

export async function getMarketRankings(market: MarketId, kind: RankingKind): Promise<RankingsPayload> {
  if (!hasTossCredentials()) {
    return buildDemoRankings(market, kind);
  }

  return cached(`rankings:${market}:${kind}`, TTL.rankings, async () => {
    const response = await getRankings({
      type: RANKING_TYPE_BY_KIND[kind],
      marketCountry: market,
      // TOP_GAINERS/TOP_LOSERS는 realtime 미지원 → 1d 고정
      duration: "1d",
      count: 10,
    });

    const symbols = response.rankings.map((item) => item.symbol);
    const names = await settle(loadStockNames(symbols));

    return {
      market,
      kind,
      generatedAt: new Date().toISOString(),
      isDemo: false,
      rows: response.rankings.map((item) => ({
        rank: item.rank,
        symbol: item.symbol,
        name: names?.get(item.symbol)?.name ?? item.symbol,
        lastPrice: parseDecimal(item.price.lastPrice),
        changeRate: parseDecimal(item.price.changeRate),
        tradingAmount: parseDecimal(item.tradingAmount),
        currency: item.currency,
      })),
    } satisfies RankingsPayload;
  }).catch(() => buildDemoRankings(market, kind));
}

// ---------------------------------------------------------------------------
// 섹터 상세
// ---------------------------------------------------------------------------

export async function getSectorDetail(market: MarketId, slug: string): Promise<SectorDetailPayload | null> {
  const sector = findSector(market, slug);
  if (!sector) {
    return null;
  }

  if (!hasTossCredentials()) {
    return buildDemoSectorDetail(sector);
  }

  return cached(`sector:${market}:${slug}`, TTL.sectorDetail, async () => {
    const currency = market === "KR" ? "KRW" : "USD";
    const constituentSymbols = sector.constituents.map((stock) => stock.symbol);

    const [etfCandles, stockMaster, ...constituentCandles] = await Promise.all([
      settleWithRetry(() => getDailyCandles(sector.etf.symbol, HEATMAP_CANDLE_COUNT)),
      settle(loadStockNames(constituentSymbols)),
      ...sector.constituents.map((stock) => settleWithRetry(() => getDailyCandles(stock.symbol, 2))),
    ]);

    const etfQuote = latestQuoteFromCandles(etfCandles?.candles ?? []);

    const constituents = sector.constituents
      .map((stock, index) => {
        const quote = latestQuoteFromCandles(constituentCandles[index]?.candles ?? []);
        const master = stockMaster?.get(stock.symbol);

        return {
          symbol: stock.symbol,
          name: master?.name ?? stock.name,
          lastPrice: quote.lastPrice,
          changeRate: quote.changeRate,
          marketCap: computeMarketCap(quote.lastPrice, master?.sharesOutstanding),
          currency,
        };
      })
      .sort((a, b) => (b.marketCap ?? 0) - (a.marketCap ?? 0));

    const hasAnyData = etfQuote.lastPrice !== null || constituents.some((row) => row.lastPrice !== null);
    if (!hasAnyData) {
      throw new Error(`섹터 상세 데이터 없음 (${market}/${slug})`);
    }

    return {
      market,
      slug,
      name: sector.name,
      generatedAt: new Date().toISOString(),
      isDemo: false,
      etf: {
        symbol: sector.etf.symbol,
        name: sector.etf.name,
        lastPrice: etfQuote.lastPrice,
        currency,
        returns: computePeriodReturns(etfCandles?.candles ?? []),
      },
      constituents,
    } satisfies SectorDetailPayload;
  }).catch(() => buildDemoSectorDetail(sector));
}
