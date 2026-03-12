import { generateAiSummary } from "@/lib/analysis/ai-summary";
import { resolveCompanyContext } from "@/lib/analysis/company-context.server";
import { buildTechnicalAnalysis } from "@/lib/analysis/technical";
import { getCandlesWithFallback } from "@/lib/market/provider";
import { getStockBySymbol } from "@/lib/stock-master";
import type { AiSummary, CandleInterval, CandleRange, TechnicalResponse } from "@/lib/types";

const technicalResponseCache = new Map<
  string,
  {
    expiresAt: number;
    payload: TechnicalResponse;
  }
>();

const inflightTechnicalRequests = new Map<string, Promise<TechnicalResponse>>();

function buildTechnicalCacheKey(symbol: string, interval: CandleInterval, range: CandleRange) {
  return `${symbol}:${interval}:${range}`;
}

function getTechnicalCacheTtl(interval: CandleInterval, range: CandleRange) {
  if (interval.endsWith("m")) {
    return 30_000;
  }

  if (range === "max" || range === "5y" || range === "3y") {
    return 10 * 60_000;
  }

  return 2 * 60_000;
}

function getCachedTechnicalResponse(cacheKey: string) {
  const cached = technicalResponseCache.get(cacheKey);

  if (!cached) {
    return null;
  }

  if (cached.expiresAt <= Date.now()) {
    technicalResponseCache.delete(cacheKey);
    return null;
  }

  return cached.payload;
}

export async function loadTechnicalResponse(
  symbol: string,
  interval: CandleInterval,
  range: CandleRange,
): Promise<TechnicalResponse> {
  const cacheKey = buildTechnicalCacheKey(symbol, interval, range);
  const cached = getCachedTechnicalResponse(cacheKey);

  if (cached) {
    return cached;
  }

  const inflight = inflightTechnicalRequests.get(cacheKey);
  if (inflight) {
    return inflight;
  }

  const request = (async () => {
    const stock = getStockBySymbol(symbol);
    if (!stock) {
      throw new Error("등록되지 않은 종목 코드입니다.");
    }

    const payload = await getCandlesWithFallback(symbol, interval, range);
    const companyContext = await resolveCompanyContext(stock);
    const analysis = buildTechnicalAnalysis(payload.candles, payload.quote, stock, companyContext);

    const response = {
      stock,
      companyContext,
      interval,
      range,
      ...payload,
      ...analysis,
    };

    technicalResponseCache.set(cacheKey, {
      expiresAt: Date.now() + getTechnicalCacheTtl(interval, range),
      payload: response,
    });

    return response;
  })().finally(() => {
    inflightTechnicalRequests.delete(cacheKey);
  });

  inflightTechnicalRequests.set(cacheKey, request);

  return request;
}

export async function loadAnalysisPageData(
  symbol: string,
  interval: CandleInterval,
  range: CandleRange,
): Promise<{ technicalResponse: TechnicalResponse; aiSummary: AiSummary }> {
  const technicalResponse = await loadTechnicalResponse(symbol, interval, range);
  const aiSummary = await generateAiSummary(
    technicalResponse.stock,
    technicalResponse.technical,
    technicalResponse.signal,
    technicalResponse.companyContext,
  );

  return {
    technicalResponse,
    aiSummary,
  };
}
