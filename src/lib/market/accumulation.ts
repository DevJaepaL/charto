import { inferInstrumentProfile } from "@/lib/analysis/company-context";
import { callKis } from "@/lib/market/kis-provider";
import { hasKisCredentials } from "@/lib/market/provider";
import { getStockBySymbol } from "@/lib/stock-master";
import type { AccumulationResponse, AccumulationStockItem, StockLookupItem } from "@/lib/types";

const ACCUMULATION_WINDOW_DAYS = 5;
const ACCUMULATION_HOME_LIMIT = 6;
const ACCUMULATION_CANDIDATE_LIMIT = 20;
const ACCUMULATION_CACHE_TTL_MS = 5 * 60_000;
const ACCUMULATION_LABEL = "외인 & 기관이 매집중인 종목";
const ACCUMULATION_MIN_POSITIVE_DAYS = 2;
const ACCUMULATION_MAX_PRICE_CHANGE_PERCENT = 12;
const ACCUMULATION_MAX_DAILY_ABS_CHANGE = 7;
const FOREIGN_INSTITUTION_SCREEN_CODE = "16449";
const FOREIGN_INSTITUTION_MARKET_CODE = "V";

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
    notice: "최근 5거래일 누적으로 외인과 기관이 함께 순매수 우위인 종목을 추려서 보여줘요.",
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
      foreignNetBuyAmount: toNumber(row.frgn_ntby_tr_pbmn),
      institutionNetBuyAmount: toNumber(row.orgn_ntby_tr_pbmn),
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
  const maxDailyAbsChange = recentRows.reduce((maxValue, row) => {
    if (row.changePercent === null) {
      return maxValue;
    }

    return Math.max(maxValue, Math.abs(row.changePercent));
  }, 0);

  const qualifies =
    positiveDays >= ACCUMULATION_MIN_POSITIVE_DAYS &&
    foreignNetBuyAmount5d > 0 &&
    institutionNetBuyAmount5d > 0 &&
    combinedNetBuyAmount5d > 0 &&
    (priceChangePercent5d === null ||
      Math.abs(priceChangePercent5d) <= ACCUMULATION_MAX_PRICE_CHANGE_PERCENT) &&
    maxDailyAbsChange <= ACCUMULATION_MAX_DAILY_ABS_CHANGE;

  if (!qualifies) {
    return null;
  }

  const rankScore =
    seedScore * 1_000_000_000 +
    positiveDays * 100_000_000 +
    combinedNetBuyAmount5d -
    Math.round(Math.abs(priceChangePercent5d ?? 0) * 1_000_000);

  return {
    stock,
    foreignNetBuyAmount5d,
    institutionNetBuyAmount5d,
    combinedNetBuyAmount5d,
    positiveDays,
    priceChangePercent5d:
      priceChangePercent5d === null ? null : Number(priceChangePercent5d.toFixed(2)),
    reason: `최근 ${ACCUMULATION_WINDOW_DAYS}거래일 중 ${positiveDays}일 외인·기관 수급 우위`,
    rankScore,
  } satisfies AccumulationStockItem;
}

function sortAccumulationItems(items: AccumulationStockItem[]) {
  return [...items].sort((left, right) => {
    if (left.positiveDays !== right.positiveDays) {
      return right.positiveDays - left.positiveDays;
    }

    if (left.combinedNetBuyAmount5d !== right.combinedNetBuyAmount5d) {
      return right.combinedNetBuyAmount5d - left.combinedNetBuyAmount5d;
    }

    return Math.abs(left.priceChangePercent5d ?? 0) - Math.abs(right.priceChangePercent5d ?? 0);
  });
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
    const [overallRows, foreignRows, institutionRows] = await Promise.all([
      requestForeignInstitutionRows("0"),
      requestForeignInstitutionRows("1"),
      requestForeignInstitutionRows("2"),
    ]);

    const candidateSeeds = mergeCandidateSeeds([
      buildCandidateSeeds(overallRows, 30),
      buildCandidateSeeds(foreignRows, 20),
      buildCandidateSeeds(institutionRows, 20),
    ]);

    const evaluated = await Promise.allSettled(
      candidateSeeds.map(async (seed) => {
        const payload = await requestInvestorTradeByStockDaily(seed.stock.symbol);
        const rows = getInvestorTradeRows(payload);
        return evaluateAccumulationCandidate(seed.stock, rows, seed.seedScore);
      }),
    );

    const payload = {
      label: ACCUMULATION_LABEL,
      source: "kis",
      windowDays: ACCUMULATION_WINDOW_DAYS,
      asOf: new Date().toISOString(),
      notice:
        "최근 5거래일 누적으로 외인과 기관이 함께 순매수 우위인 종목이에요. 이미 급등한 종목은 최대한 제외했어요.",
      items: sortAccumulationItems(
        evaluated.flatMap((result) => {
          if (result.status !== "fulfilled" || result.value === null) {
            return [];
          }

          return [result.value];
        }),
      ).slice(0, limit),
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
