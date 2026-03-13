import { NextResponse } from "next/server";

import { loadTechnicalResponse } from "@/lib/analysis/load-analysis-data";
import { loadMarketRanking } from "@/lib/market/rankings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  try {
    const rankings = await loadMarketRanking("value");
    result.checks.rankings = {
      ok: true,
      source: rankings.source,
      itemCount: rankings.items.length,
      firstSymbol: rankings.items[0]?.stock.symbol ?? null,
      error: null,
    };
  } catch (error) {
    result.ok = false;
    result.checks.rankings.error =
      error instanceof Error ? error.message : "rankings check failed";
  }

  try {
    const technical = await loadTechnicalResponse("005930", "1d", "1mo");
    result.checks.technical = {
      ok: true,
      provider: technical.provider,
      isDemo: technical.isDemo,
      chartUnavailable: technical.chartUnavailable ?? false,
      currentPrice: technical.quote.currentPrice,
      candleCount: technical.candles.length,
      error: null,
    };
  } catch (error) {
    result.ok = false;
    result.checks.technical.error =
      error instanceof Error ? error.message : "technical check failed";
  }

  return NextResponse.json(result);
}
