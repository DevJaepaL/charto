import { NextRequest, NextResponse } from "next/server";

import { isMarketId } from "@/lib/market-v2/sectors";
import { getSectorDetail } from "@/lib/market-v2/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ market: string; slug: string }> },
) {
  const { market, slug } = await params;
  const marketUpper = market.toUpperCase();

  if (!isMarketId(marketUpper)) {
    return NextResponse.json({ error: "market은 KR 또는 US여야 합니다" }, { status: 400 });
  }

  const payload = await getSectorDetail(marketUpper, slug);

  if (!payload) {
    return NextResponse.json({ error: "섹터를 찾을 수 없습니다" }, { status: 404 });
  }

  return NextResponse.json(payload, {
    headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" },
  });
}
