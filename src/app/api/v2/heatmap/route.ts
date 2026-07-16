import { NextRequest, NextResponse } from "next/server";

import { isMarketId } from "@/lib/market-v2/sectors";
import { getSectorHeatmap } from "@/lib/market-v2/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const market = request.nextUrl.searchParams.get("market") ?? "KR";

  if (!isMarketId(market)) {
    return NextResponse.json({ error: "market은 KR 또는 US여야 합니다" }, { status: 400 });
  }

  const payload = await getSectorHeatmap(market);

  return NextResponse.json(payload, {
    headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" },
  });
}
