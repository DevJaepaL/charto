import { generateAiSummary } from "@/lib/analysis/ai-summary";
import { resolveCompanyContext } from "@/lib/analysis/company-context.server";
import { resolveEarningsContext } from "@/lib/analysis/earnings-context.server";
import { getTechnicalCacheTtl } from "@/lib/analysis/technical-request-policy";
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

    const [payload, companyContext] = await Promise.all([
      getCandlesWithFallback(symbol, interval, range),
      resolveCompanyContext(stock),
    ]);
    const earningsContext = await resolveEarningsContext(stock, companyContext);
    const analysis = buildTechnicalAnalysis(payload.candles, payload.quote, stock, companyContext);

    const response = {
      stock,
      companyContext,
      earningsContext,
      interval,
      range,
      ...payload,
      ...analysis,
    };

    technicalResponseCache.set(cacheKey, {
      expiresAt: Date.now() + getTechnicalCacheTtl(interval, range, response.isDemo),
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
    technicalResponse.earningsContext,
  );

  return {
    technicalResponse,
    aiSummary,
  };
}
