import { z } from "zod";

import { inferInstrumentProfile } from "@/lib/analysis/company-context";
import { DemoMarketDataProvider } from "@/lib/market/demo-provider";
import { getKisCurrentQuoteOrNull, KisMarketDataProvider } from "@/lib/market/kis-provider";
import { getStockBySymbol } from "@/lib/stock-master";
import type {
  Candle,
  CandleInterval,
  CandleRange,
  ProviderId,
  QuoteSnapshot,
} from "@/lib/types";

const SUPPORTED_SYMBOL_PATTERN = /^[A-Z0-9]{4,12}$/;
const REALTIME_SYMBOL_PATTERN = /^\d{6}$/;
const CHART_UNAVAILABLE_PRODUCT_PATTERN =
  /(WTI원유|원유 ?선물|브렌트|천연가스|금 ?선물|은 ?선물|구리 ?선물|달러 ?선물|채권선물|탄소배출권 ?선물|원자재 ?선물)/i;

export const candlesQuerySchema = z.object({
  symbol: z
    .string()
    .trim()
    .transform((value) => value.toUpperCase())
    .pipe(z.string().regex(SUPPORTED_SYMBOL_PATTERN)),
  interval: z.enum(["1m", "5m", "15m", "60m", "1d", "1w"]).default("1d"),
  range: z.enum(["1d", "1w", "1mo", "3mo", "6mo", "1y", "3y", "5y", "max"]).default("max"),
});

export interface ProviderCandlePayload {
  provider: ProviderId;
  isDemo: boolean;
  chartUnavailable?: boolean;
  notice?: string;
  candles: Candle[];
  quote: QuoteSnapshot;
}

export interface MarketDataProvider {
  providerId: ProviderId;
  getCandles(
    symbol: string,
    interval: CandleInterval,
    range: CandleRange,
  ): Promise<ProviderCandlePayload>;
}

export function hasKisCredentials() {
  return Boolean(process.env.KIS_APP_KEY && process.env.KIS_APP_SECRET);
}

export function supportsRealtimeKisSymbol(symbol: string) {
  return REALTIME_SYMBOL_PATTERN.test(symbol);
}

export function getMarketDataProvider(): MarketDataProvider {
  if (hasKisCredentials()) {
    return new KisMarketDataProvider();
  }

  return new DemoMarketDataProvider();
}

export function shouldPreferUnavailableChartFallback(symbol: string) {
  const stock = getStockBySymbol(symbol);
  if (!stock) {
    return false;
  }

  const profile = inferInstrumentProfile(stock);
  return profile.isExchangeTradedProduct && CHART_UNAVAILABLE_PRODUCT_PATTERN.test(stock.name);
}

function buildUnavailableChartNotice(symbol: string) {
  const stock = getStockBySymbol(symbol);
  const label = stock?.name ?? symbol;

  return `${label}은 현재 차트 데이터를 제공하지 않아 차트를 표시하지 않습니다.`;
}

export async function getCandlesWithFallback(
  symbol: string,
  interval: CandleInterval,
  range: CandleRange,
): Promise<ProviderCandlePayload> {
  if (!supportsRealtimeKisSymbol(symbol)) {
    if (shouldPreferUnavailableChartFallback(symbol)) {
      const quote = (await getKisCurrentQuoteOrNull(symbol)) ?? {
        currentPrice: 0,
        previousClose: 0,
        change: 0,
        changePercent: 0,
        open: 0,
        high: 0,
        low: 0,
        volume: 0,
      };

      return {
        provider: "kis",
        isDemo: false,
        chartUnavailable: true,
        notice: buildUnavailableChartNotice(symbol),
        candles: [],
        quote,
      };
    }

    const fallbackPayload = await new DemoMarketDataProvider().getCandles(symbol, interval, range);

    return {
      ...fallbackPayload,
      notice:
        "이 종목 코드는 현재 실시간 시세 연동 대상이 아니어서 예시 차트로 표시합니다.",
    };
  }

  if (!hasKisCredentials()) {
    return new DemoMarketDataProvider().getCandles(symbol, interval, range);
  }

  try {
    return await new KisMarketDataProvider().getCandles(symbol, interval, range);
  } catch (error) {
    if (shouldPreferUnavailableChartFallback(symbol)) {
      const quote = (await getKisCurrentQuoteOrNull(symbol)) ?? {
        currentPrice: 0,
        previousClose: 0,
        change: 0,
        changePercent: 0,
        open: 0,
        high: 0,
        low: 0,
        volume: 0,
      };

      return {
        provider: "kis",
        isDemo: false,
        chartUnavailable: true,
        notice: buildUnavailableChartNotice(symbol),
        candles: [],
        quote,
      };
    }

    const fallbackPayload = await new DemoMarketDataProvider().getCandles(symbol, interval, range);
    const reason = error instanceof Error ? error.message : "실시간 시세 호출 실패";

    return {
      ...fallbackPayload,
      notice: `실시간 시세를 불러오지 못해 데모 데이터로 전환했습니다. ${reason}`,
    };
  }
}
