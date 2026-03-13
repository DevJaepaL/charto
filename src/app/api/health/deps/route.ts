import { NextResponse } from "next/server";

import { loadTechnicalResponse } from "@/lib/analysis/load-analysis-data";
import { loadMarketRanking } from "@/lib/market/rankings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function withTimeout<T>(task: Promise<T>, timeoutMs: number, timeoutMessage: string) {
  return await Promise.race([
    task,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
    }),
  ]);
}

export async function GET() {
  const result = {
    ok: true,
    timestamp: new Date().toISOString(),
    checks: {
      rankings: {
        ok: false,
        source: null as string | null,
        itemCount: 0,
        firstSymbol: null as string | null,
        error: null as string | null,
      },
      technical: {
        ok: false,
        provider: null as string | null,
        isDemo: null as boolean | null,
        chartUnavailable: null as boolean | null,
        currentPrice: null as number | null,
        candleCount: 0,
        error: null as string | null,
      },
    },
  };

  const [rankingsResult, technicalResult] = await Promise.allSettled([
    withTimeout(loadMarketRanking("value"), 8_000, "rankings timeout"),
    withTimeout(loadTechnicalResponse("005930", "1d", "1mo"), 8_000, "technical timeout"),
  ]);

  if (rankingsResult.status === "fulfilled") {
    const rankings = rankingsResult.value;
    result.checks.rankings = {
      ok: true,
      source: rankings.source,
      itemCount: rankings.items.length,
      firstSymbol: rankings.items[0]?.stock.symbol ?? null,
      error: null,
    };
  } else {
    result.ok = false;
    result.checks.rankings.error =
      rankingsResult.reason instanceof Error
        ? rankingsResult.reason.message
        : "rankings check failed";
  }

  if (technicalResult.status === "fulfilled") {
    const technical = technicalResult.value;
    result.checks.technical = {
      ok: true,
      provider: technical.provider,
      isDemo: technical.isDemo,
      chartUnavailable: technical.chartUnavailable ?? false,
      currentPrice: technical.quote.currentPrice,
      candleCount: technical.candles.length,
      error: null,
    };
  } else {
    result.ok = false;
    result.checks.technical.error =
      technicalResult.reason instanceof Error
        ? technicalResult.reason.message
        : "technical check failed";
  }

  return NextResponse.json(result);
}
