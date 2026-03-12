import { NextResponse } from "next/server";

import { candlesQuerySchema, getCandlesWithFallback } from "@/lib/market/provider";
import { getStockBySymbol } from "@/lib/stock-master";
import type { CandlesResponse } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = candlesQuerySchema.parse({
      symbol: searchParams.get("symbol") ?? "",
      interval: searchParams.get("interval") ?? undefined,
      range: searchParams.get("range") ?? undefined,
    });

    const stock = getStockBySymbol(parsed.symbol);
    if (!stock) {
      return NextResponse.json({ error: "등록되지 않은 종목 코드입니다." }, { status: 404 });
    }

    const payload = await getCandlesWithFallback(parsed.symbol, parsed.interval, parsed.range);

    const response: CandlesResponse = {
      stock,
      interval: parsed.interval,
      range: parsed.range,
      ...payload,
    };

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "시세 조회 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
