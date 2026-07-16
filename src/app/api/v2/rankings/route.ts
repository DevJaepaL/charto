import { NextRequest, NextResponse } from "next/server";

import { isMarketId } from "@/lib/market-v2/sectors";
import { getMarketRankings } from "@/lib/market-v2/service";
import type { RankingKind } from "@/lib/market-v2/view-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KINDS: RankingKind[] = ["gainers", "losers", "amount"];

export async function GET(request: NextRequest) {
  const market = request.nextUrl.searchParams.get("market") ?? "KR";
  const kind = request.nextUrl.searchParams.get("kind") ?? "gainers";

  if (!isMarketId(market)) {
    return NextResponse.json({ error: "market은 KR 또는 US여야 합니다" }, { status: 400 });
  }

  if (!KINDS.includes(kind as RankingKind)) {
    return NextResponse.json({ error: "kind는 gainers·losers·amount 중 하나여야 합니다" }, { status: 400 });
  }

  const payload = await getMarketRankings(market, kind as RankingKind);

  return NextResponse.json(payload, {
    headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=180" },
  });
}
