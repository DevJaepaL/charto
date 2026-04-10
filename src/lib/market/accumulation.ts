import { inferInstrumentProfile } from "@/lib/analysis/company-context";
import { callKis } from "@/lib/market/kis-provider";
import { hasKisCredentials } from "@/lib/market/provider";
import { loadMarketRanking } from "@/lib/market/rankings";
import { getStockBySymbol } from "@/lib/stock-master";
import type { AccumulationResponse, AccumulationStockItem, MarketRankItem, StockLookupItem } from "@/lib/types";

const ACCUMULATION_WINDOW_DAYS = 5;
const ACCUMULATION_HOME_LIMIT = 12;
const ACCUMULATION_CANDIDATE_LIMIT = 40;
const ACCUMULATION_CACHE_TTL_MS = 5 * 60_000;
const ACCUMULATION_LABEL = "외인·기관 매수세가 이어지는 종목";
const FOREIGN_BUY_STREAK_MIN = 5;
const INSTITUTION_BUY_STREAK_MIN = 3;
const DUAL_FOREIGN_BUY_STREAK_MIN = 5;
const DUAL_INSTITUTION_BUY_STREAK_MIN = 2;
const DUAL_POSITIVE_DAYS_MIN = 2;
const FOREIGN_INSTITUTION_SCREEN_CODE = "16449";
const FOREIGN_INSTITUTION_MARKET_CODE = "V";
const INVESTOR_TRADE_AMOUNT_UNIT_WON = 1_000_000;

type ForeignInstitutionTotalRow = Record<string, string>;

type InvestorTradeByStockDailyPayload = {
  output1?: Array<Record<string, string>> | Record<string, string>;
  output2?: Array<Record<string, string>> | Record<string, string>;
};

type InvestorTradeDay = {
  date: string;
  close: number | null;
  changePercent: number | null;
  foreignNetBuyAmount: number;
  institutionNetBuyAmount: number;
};

type CandidateSeed = {
  stock: StockLookupItem;
  bestRank: number;
  seedScore: number;
};

const accumulationCache = new Map<
  number,
  {
    expiresAt: number;
    payload: AccumulationResponse;
  }
>();

function toNumber(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value !== "string") {
    return 0;
  }

  const normalized = value.replaceAll(",", "").trim();
  if (!normalized) {
    return 0;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toOptionalNumber(value: unknown) {
  const parsed = toNumber(value);
  return parsed === 0 && value !== "0" && value !== 0 ? null : parsed;
}

function getKstDateKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(date)
    .replaceAll("-", "");
}

function getCachedAccumulation(limit: number) {
  const cached = accumulationCache.get(limit);
  if (!cached) {
    return null;
  }

  if (cached.expiresAt <= Date.now()) {
    accumulationCache.delete(limit);
    return null;
  }

  return cached.payload;
}

function isEligibleAccumulationStock(stock: StockLookupItem) {
  if (stock.market === "KONEX" || !/^\d{6}$/.test(stock.symbol)) {
    return false;
  }

  return inferInstrumentProfile(stock).kind === "stock";
}

function buildDemoAccumulationResponse(): AccumulationResponse {
  return {
    label: ACCUMULATION_LABEL,
    source: "demo",
    windowDays: ACCUMULATION_WINDOW_DAYS,
    asOf: new Date().toISOString(),
    notice: "최근 외인과 기관이 꾸준히 매수하고 있는 종목이에요.",
    items: [],
  };
}

function flattenKisRows(
  value: Array<Record<string, string>> | Record<string, string> | undefined,
) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "object") {
    return [value];
  }

  return [];
}

async function requestForeignInstitutionRows(etcClassCode: "0" | "1" | "2") {
  const payload = (await callKis(
    "/uapi/domestic-stock/v1/quotations/foreign-institution-total",
    "FHPTJ04400000",
    {
      FID_COND_MRKT_DIV_CODE: FOREIGN_INSTITUTION_MARKET_CODE,
      FID_COND_SCR_DIV_CODE: FOREIGN_INSTITUTION_SCREEN_CODE,
      FID_INPUT_ISCD: "0000",
      FID_DIV_CLS_CODE: "1",
      FID_RANK_SORT_CLS_CODE: "0",
      FID_ETC_CLS_CODE: etcClassCode,
    },
  )) as {
    output?: ForeignInstitutionTotalRow[];
  };

  return payload.output ?? [];
}

function buildCandidateSeeds(rows: ForeignInstitutionTotalRow[], scoreBias: number) {
  return rows.reduce<CandidateSeed[]>((accumulator, row, index) => {
    const symbol = (row.mksc_shrn_iscd ?? row.stck_shrn_iscd ?? "").trim();
    if (!symbol) {
      return accumulator;
    }

    const stock = getStockBySymbol(symbol);
    if (!stock || !isEligibleAccumulationStock(stock)) {
      return accumulator;
    }

    accumulator.push({
      stock,
      bestRank: index + 1,
      seedScore: scoreBias + Math.max(0, 25 - index),
    });

    return accumulator;
  }, []);
}

function buildRankingCandidateSeeds(items: MarketRankItem[], scoreBias: number) {
  return items.reduce<CandidateSeed[]>((accumulator, item, index) => {
    if (!isEligibleAccumulationStock(item.stock)) {
      return accumulator;
    }

    accumulator.push({
      stock: item.stock,
      bestRank: index + 1,
      seedScore: scoreBias + Math.max(0, 18 - index),
    });

    return accumulator;
  }, []);
}

function mergeCandidateSeeds(seedGroups: CandidateSeed[][]) {
  const merged = new Map<string, CandidateSeed>();

  seedGroups.flat().forEach((seed) => {
    const current = merged.get(seed.stock.symbol);
    if (!current) {
      merged.set(seed.stock.symbol, seed);
      return;
    }

    merged.set(seed.stock.symbol, {
      stock: seed.stock,
      bestRank: Math.min(current.bestRank, seed.bestRank),
      seedScore: Math.max(current.seedScore, seed.seedScore) + seed.seedScore / 10,
    });
  });

  return [...merged.values()]
    .sort((left, right) => {
      if (left.bestRank !== right.bestRank) {
        return left.bestRank - right.bestRank;
      }

      return right.seedScore - left.seedScore;
    })
    .slice(0, ACCUMULATION_CANDIDATE_LIMIT);
}

function buildIntradayFallbackItems(
  rowGroups: ForeignInstitutionTotalRow[][],
  limit: number,
): AccumulationStockItem[] {
  const items = new Map<string, AccumulationStockItem>();

  rowGroups.flat().forEach((row, index) => {
    const symbol = (row.mksc_shrn_iscd ?? row.stck_shrn_iscd ?? "").trim();
    const stock = symbol ? getStockBySymbol(symbol) : null;

    if (!stock || !isEligibleAccumulationStock(stock)) {
      return;
    }

    const foreignNetBuyAmount5d = toNumber(row.frgn_ntby_tr_pbmn) * INVESTOR_TRADE_AMOUNT_UNIT_WON;
    const institutionNetBuyAmount5d = toNumber(row.orgn_ntby_tr_pbmn) * INVESTOR_TRADE_AMOUNT_UNIT_WON;
    const combinedNetBuyAmount5d = foreignNetBuyAmount5d + institutionNetBuyAmount5d;

    if (foreignNetBuyAmount5d === 0 && institutionNetBuyAmount5d === 0) {
      return;
    }

    const signalKind: AccumulationStockItem["signalKind"] =
      Math.abs(foreignNetBuyAmount5d) > Math.abs(institutionNetBuyAmount5d)
        ? "foreign"
        : Math.abs(institutionNetBuyAmount5d) > Math.abs(foreignNetBuyAmount5d)
          ? "institution"
          : "both";

    const candidate = {
      stock,
      foreignNetBuyAmount5d,
      institutionNetBuyAmount5d,
      combinedNetBuyAmount5d,
      positiveDays: Number(combinedNetBuyAmount5d > 0),
      foreignPositiveDays: Number(foreignNetBuyAmount5d > 0),
      institutionPositiveDays: Number(institutionNetBuyAmount5d > 0),
      foreignBuyStreak: 0,
      foreignSellStreak: 0,
      institutionBuyStreak: 0,
      institutionSellStreak: 0,
      priceChangePercent5d: toOptionalNumber(row.prdy_ctrt),
      signalKind,
      reason: "장중 외인·기관 수급 포착",
      rankScore:
        (Math.max(limit - index, 0) + 1) * 1_000_000_000_000 +
        Math.max(foreignNetBuyAmount5d, 0) +
        Math.max(institutionNetBuyAmount5d, 0),
    } satisfies AccumulationStockItem;

    const current = items.get(stock.symbol);
    if (!current || candidate.rankScore > current.rankScore) {
      items.set(stock.symbol, candidate);
    }
  });

  return sortAccumulationItems([...items.values()]).slice(0, limit);
}

async function requestInvestorTradeByStockDaily(symbol: string) {
  return (await callKis(
    "/uapi/domestic-stock/v1/quotations/investor-trade-by-stock-daily",
    "FHPTJ04160001",
    {
      FID_COND_MRKT_DIV_CODE: "J",
      FID_INPUT_ISCD: symbol,
      FID_INPUT_DATE_1: getKstDateKey(),
      FID_ORG_ADJ_PRC: "",
      FID_ETC_CLS_CODE: "",
    },
  )) as InvestorTradeByStockDailyPayload;
}

function getInvestorTradeRows(payload: InvestorTradeByStockDailyPayload) {
  const rows = [...flattenKisRows(payload.output1), ...flattenKisRows(payload.output2)];
  const deduped = new Map<string, InvestorTradeDay>();

  rows.forEach((row) => {
    const date = row.stck_bsop_date?.trim();
    if (!date) {
      return;
    }

    const candidate = {
      date,
      close: toOptionalNumber(row.stck_clpr ?? row.stck_prpr),
      changePercent: toOptionalNumber(row.prdy_ctrt),
      foreignNetBuyAmount: toNumber(row.frgn_ntby_tr_pbmn) * INVESTOR_TRADE_AMOUNT_UNIT_WON,
      institutionNetBuyAmount: toNumber(row.orgn_ntby_tr_pbmn) * INVESTOR_TRADE_AMOUNT_UNIT_WON,
    } satisfies InvestorTradeDay;

    if (candidate.close === null) {
      return;
    }

    const previous = deduped.get(date);
    const candidateCompleteness =
      Number(candidate.changePercent !== null) +
      Number(candidate.foreignNetBuyAmount !== 0) +
      Number(candidate.institutionNetBuyAmount !== 0);
    const previousCompleteness =
      previous === undefined
        ? -1
        : Number(previous.changePercent !== null) +
          Number(previous.foreignNetBuyAmount !== 0) +
          Number(previous.institutionNetBuyAmount !== 0);

    if (!previous || candidateCompleteness >= previousCompleteness) {
      deduped.set(date, candidate);
    }
  });

  return [...deduped.values()].sort((left, right) => right.date.localeCompare(left.date));
}

function countPositiveDays(rows: InvestorTradeDay[], key: "foreignNetBuyAmount" | "institutionNetBuyAmount") {
  return rows.filter((row) => row[key] > 0).length;
}

function countBuyStreak(rows: InvestorTradeDay[], key: "foreignNetBuyAmount" | "institutionNetBuyAmount") {
  let streak = 0;

  for (const row of rows) {
    if (row[key] <= 0) {
      break;
    }

    streak += 1;
  }

  return streak;
}

function countSellStreak(rows: InvestorTradeDay[], key: "foreignNetBuyAmount" | "institutionNetBuyAmount") {
  let streak = 0;

  for (const row of rows) {
    if (row[key] >= 0) {
      break;
    }

    streak += 1;
  }

  return streak;
}

export function evaluateAccumulationCandidate(
  stock: StockLookupItem,
  rows: InvestorTradeDay[],
  seedScore = 0,
) {
  const recentRows = rows.slice(0, ACCUMULATION_WINDOW_DAYS);
  if (recentRows.length < ACCUMULATION_WINDOW_DAYS) {
    return null;
  }

  const positiveDays = recentRows.filter(
    (row) => row.foreignNetBuyAmount + row.institutionNetBuyAmount > 0,
  ).length;
  const foreignPositiveDays = countPositiveDays(recentRows, "foreignNetBuyAmount");
  const institutionPositiveDays = countPositiveDays(recentRows, "institutionNetBuyAmount");
  const foreignRecentBuyStreak = countBuyStreak(recentRows, "foreignNetBuyAmount");
  const institutionRecentBuyStreak = countBuyStreak(recentRows, "institutionNetBuyAmount");
  const foreignBuyStreak = countBuyStreak(rows, "foreignNetBuyAmount");
  const foreignSellStreak = countSellStreak(rows, "foreignNetBuyAmount");
  const institutionBuyStreak = countBuyStreak(rows, "institutionNetBuyAmount");
  const institutionSellStreak = countSellStreak(rows, "institutionNetBuyAmount");
  const foreignNetBuyAmount5d = recentRows.reduce(
    (total, row) => total + row.foreignNetBuyAmount,
    0,
  );
  const institutionNetBuyAmount5d = recentRows.reduce(
    (total, row) => total + row.institutionNetBuyAmount,
    0,
  );
  const combinedNetBuyAmount5d = foreignNetBuyAmount5d + institutionNetBuyAmount5d;
  const latestClose = recentRows[0]?.close ?? null;
  const oldestClose = recentRows.at(-1)?.close ?? null;
  const priceChangePercent5d =
    latestClose && oldestClose
      ? ((latestClose - oldestClose) / oldestClose) * 100
      : null;
  const qualifiesDualStreak =
    foreignRecentBuyStreak >= DUAL_FOREIGN_BUY_STREAK_MIN &&
    institutionRecentBuyStreak >= DUAL_INSTITUTION_BUY_STREAK_MIN;
  const qualifiesForeignStreak = foreignRecentBuyStreak >= FOREIGN_BUY_STREAK_MIN;
  const qualifiesInstitutionStreak = institutionRecentBuyStreak >= INSTITUTION_BUY_STREAK_MIN;
  const qualifiesDualNet =
    foreignNetBuyAmount5d > 0 &&
    institutionNetBuyAmount5d > 0 &&
    positiveDays >= DUAL_POSITIVE_DAYS_MIN;

  if (
    !qualifiesDualStreak &&
    !qualifiesForeignStreak &&
    !qualifiesInstitutionStreak &&
    !qualifiesDualNet
  ) {
    return null;
  }

  let signalKind: AccumulationStockItem["signalKind"] = "both";
  let signalPriority = 1;
  let reason = `외인 최근 ${ACCUMULATION_WINDOW_DAYS}일 ${foreignPositiveDays}일 순매수 · 기관 최근 ${ACCUMULATION_WINDOW_DAYS}일 ${institutionPositiveDays}일 순매수`;

  if (qualifiesDualStreak || (qualifiesForeignStreak && qualifiesInstitutionStreak)) {
    signalKind = "both";
    signalPriority = 4;
    reason = `외인 ${foreignBuyStreak}일 연속 순매수 · 기관 ${institutionBuyStreak}일 연속 순매수`;
  } else if (qualifiesForeignStreak) {
    signalKind = "foreign";
    signalPriority = 3;
    reason =
      institutionNetBuyAmount5d < 0
        ? `외인 ${foreignBuyStreak}일 연속 순매수 · 기관은 최근 ${ACCUMULATION_WINDOW_DAYS}일 순매도`
        : institutionBuyStreak > 0
          ? `외인 ${foreignBuyStreak}일 연속 순매수 · 기관 ${institutionBuyStreak}일 연속 순매수`
          : `외인 ${foreignBuyStreak}일 연속 순매수 · 기관도 최근 ${ACCUMULATION_WINDOW_DAYS}일 누적 순매수`;
  } else if (qualifiesInstitutionStreak) {
    signalKind = "institution";
    signalPriority = 2;
    reason =
      foreignNetBuyAmount5d < 0
        ? `기관 ${institutionBuyStreak}일 연속 순매수 · 외인은 최근 ${ACCUMULATION_WINDOW_DAYS}일 순매도`
        : foreignBuyStreak > 0
          ? `기관 ${institutionBuyStreak}일 연속 순매수 · 외인 ${foreignBuyStreak}일 연속 순매수`
          : `기관 ${institutionBuyStreak}일 연속 순매수 · 외인도 최근 ${ACCUMULATION_WINDOW_DAYS}일 누적 순매수`;
  } else if (foreignBuyStreak > 0 && institutionBuyStreak > 0) {
    reason = `외인 ${foreignBuyStreak}일 연속 순매수 · 기관 ${institutionBuyStreak}일 연속 순매수`;
  } else if (foreignBuyStreak > 0) {
    reason = `외인 ${foreignBuyStreak}일 연속 순매수 · 기관 최근 ${ACCUMULATION_WINDOW_DAYS}일 ${institutionPositiveDays}일 순매수`;
  } else if (institutionBuyStreak > 0) {
    reason = `기관 ${institutionBuyStreak}일 연속 순매수 · 외인 최근 ${ACCUMULATION_WINDOW_DAYS}일 ${foreignPositiveDays}일 순매수`;
  }

  const rankScore =
    seedScore * 1_000_000_000_000 +
    signalPriority * 100_000_000_000 +
    foreignBuyStreak * 10_000_000_000 +
    institutionBuyStreak * 5_000_000_000 +
    positiveDays * 1_000_000_000 +
    Math.max(foreignNetBuyAmount5d, 0) +
    Math.max(institutionNetBuyAmount5d, 0);

  return {
    stock,
    foreignNetBuyAmount5d,
    institutionNetBuyAmount5d,
    combinedNetBuyAmount5d,
    positiveDays,
    foreignPositiveDays,
    institutionPositiveDays,
    foreignBuyStreak,
    foreignSellStreak,
    institutionBuyStreak,
    institutionSellStreak,
    priceChangePercent5d:
      priceChangePercent5d === null ? null : Number(priceChangePercent5d.toFixed(2)),
    signalKind,
    reason,
    rankScore,
  } satisfies AccumulationStockItem;
}

function evaluateFallbackAccumulationCandidate(
  stock: StockLookupItem,
  rows: InvestorTradeDay[],
  seedScore = 0,
) {
  const recentRows = rows.slice(0, ACCUMULATION_WINDOW_DAYS);
  if (recentRows.length < ACCUMULATION_WINDOW_DAYS) {
    return null;
  }

  const strictCandidate = evaluateAccumulationCandidate(stock, rows, seedScore);
  if (strictCandidate) {
    return strictCandidate;
  }

  const positiveDays = recentRows.filter(
    (row) => row.foreignNetBuyAmount + row.institutionNetBuyAmount > 0,
  ).length;
  const foreignPositiveDays = countPositiveDays(recentRows, "foreignNetBuyAmount");
  const institutionPositiveDays = countPositiveDays(recentRows, "institutionNetBuyAmount");
  const foreignBuyStreak = countBuyStreak(rows, "foreignNetBuyAmount");
  const foreignSellStreak = countSellStreak(rows, "foreignNetBuyAmount");
  const institutionBuyStreak = countBuyStreak(rows, "institutionNetBuyAmount");
  const institutionSellStreak = countSellStreak(rows, "institutionNetBuyAmount");
  const foreignNetBuyAmount5d = recentRows.reduce(
    (total, row) => total + row.foreignNetBuyAmount,
    0,
  );
  const institutionNetBuyAmount5d = recentRows.reduce(
    (total, row) => total + row.institutionNetBuyAmount,
    0,
  );
  const combinedNetBuyAmount5d = foreignNetBuyAmount5d + institutionNetBuyAmount5d;
  const latestClose = recentRows[0]?.close ?? null;
  const oldestClose = recentRows.at(-1)?.close ?? null;
  const priceChangePercent5d =
    latestClose && oldestClose
      ? ((latestClose - oldestClose) / oldestClose) * 100
      : null;

  const hasMeaningfulFlow =
    foreignPositiveDays > 0 ||
    institutionPositiveDays > 0 ||
    foreignBuyStreak > 0 ||
    institutionBuyStreak > 0 ||
    foreignSellStreak > 0 ||
    institutionSellStreak > 0 ||
    foreignNetBuyAmount5d > 0 ||
    institutionNetBuyAmount5d > 0;

  if (!hasMeaningfulFlow) {
    return null;
  }

  let signalKind: AccumulationStockItem["signalKind"] = "both";
  if (foreignNetBuyAmount5d > institutionNetBuyAmount5d) {
    signalKind = "foreign";
  } else if (institutionNetBuyAmount5d > foreignNetBuyAmount5d) {
    signalKind = "institution";
  }

  const reason =
    foreignBuyStreak > 0 || institutionBuyStreak > 0
      ? `외인 ${foreignBuyStreak}일 연속 순매수 · 기관 ${institutionBuyStreak}일 연속 순매수`
      : `외인 최근 ${ACCUMULATION_WINDOW_DAYS}일 ${foreignPositiveDays}일 매수 · 기관 최근 ${ACCUMULATION_WINDOW_DAYS}일 ${institutionPositiveDays}일 매수`;

  const rankScore =
    seedScore * 1_000_000_000_000 +
    positiveDays * 1_000_000_000 +
    Math.max(foreignPositiveDays, institutionPositiveDays) * 100_000_000 +
    Math.max(foreignNetBuyAmount5d, 0) +
    Math.max(institutionNetBuyAmount5d, 0);

  return {
    stock,
    foreignNetBuyAmount5d,
    institutionNetBuyAmount5d,
    combinedNetBuyAmount5d,
    positiveDays,
    foreignPositiveDays,
    institutionPositiveDays,
    foreignBuyStreak,
    foreignSellStreak,
    institutionBuyStreak,
    institutionSellStreak,
    priceChangePercent5d:
      priceChangePercent5d === null ? null : Number(priceChangePercent5d.toFixed(2)),
    signalKind,
    reason,
    rankScore,
  } satisfies AccumulationStockItem;
}

function sortAccumulationItems(items: AccumulationStockItem[]) {
  return [...items].sort((left, right) => right.rankScore - left.rankScore);
}

export async function loadQuietAccumulation(limit = ACCUMULATION_HOME_LIMIT): Promise<AccumulationResponse> {
  const cached = getCachedAccumulation(limit);
  if (cached) {
    return cached;
  }

  if (!hasKisCredentials()) {
    return buildDemoAccumulationResponse();
  }

  try {
    const [overallRows, foreignRows, institutionRows, valueRanking, volumeRanking] = await Promise.all([
      requestForeignInstitutionRows("0"),
      requestForeignInstitutionRows("1"),
      requestForeignInstitutionRows("2"),
      loadMarketRanking("value"),
      loadMarketRanking("volume"),
    ]);

    const candidateSeeds = mergeCandidateSeeds([
      buildCandidateSeeds(overallRows, 30),
      buildCandidateSeeds(foreignRows, 20),
      buildCandidateSeeds(institutionRows, 20),
      buildRankingCandidateSeeds(valueRanking.items, 12),
      buildRankingCandidateSeeds(volumeRanking.items, 10),
    ]);

    const evaluated = await Promise.allSettled(
      candidateSeeds.map(async (seed) => {
        const payload = await requestInvestorTradeByStockDaily(seed.stock.symbol);
        const rows = getInvestorTradeRows(payload);
        return {
          strict: evaluateAccumulationCandidate(seed.stock, rows, seed.seedScore),
          fallback: evaluateFallbackAccumulationCandidate(seed.stock, rows, seed.seedScore),
        };
      }),
    );

    const strictItems = sortAccumulationItems(
      evaluated.flatMap((result) => {
        if (result.status !== "fulfilled" || result.value.strict === null) {
          return [];
        }

        return [result.value.strict];
      }),
    );

    const fallbackItems = sortAccumulationItems(
      evaluated.flatMap((result) => {
        if (result.status !== "fulfilled" || result.value.fallback === null) {
          return [];
        }

        return [result.value.fallback];
      }),
    );

    const intradayFallbackItems = buildIntradayFallbackItems(
      [overallRows, foreignRows, institutionRows],
      limit,
    );

    const selectedItems = strictItems.length
      ? strictItems.slice(0, limit)
      : fallbackItems.length
        ? fallbackItems.slice(0, limit)
        : intradayFallbackItems;

    const selectedWindowDays = strictItems.length || fallbackItems.length ? ACCUMULATION_WINDOW_DAYS : 1;
    const selectedNotice = strictItems.length
      ? "최근 외인과 기관이 꾸준히 매수하고 있는 종목이에요."
      : fallbackItems.length
        ? "실시간으로 외인과 기관 수급이 포착된 종목이에요."
        : "장중 외인과 기관 수급이 들어오는 종목이에요.";

    const payload = {
      label: ACCUMULATION_LABEL,
      source: "kis",
      windowDays: selectedWindowDays,
      asOf: new Date().toISOString(),
      notice: selectedNotice,
      items: selectedItems,
    } satisfies AccumulationResponse;

    accumulationCache.set(limit, {
      expiresAt: Date.now() + ACCUMULATION_CACHE_TTL_MS,
      payload,
    });

    return payload;
  } catch {
    return buildDemoAccumulationResponse();
  }
}
