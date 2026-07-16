import { NextResponse } from "next/server";

import { getMarketOverview } from "@/lib/market-v2/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const payload = await getMarketOverview();

  return NextResponse.json(payload, {
    headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=180" },
  });
}
