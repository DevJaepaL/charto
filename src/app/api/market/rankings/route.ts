import { NextResponse } from "next/server";
import { z } from "zod";

import { loadMarketRanking } from "@/lib/market/rankings";

const querySchema = z.object({
  mode: z.enum(["volume", "value", "marketCap"]).default("value"),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = querySchema.parse({
      mode: searchParams.get("mode") ?? undefined,
    });

    const payload = await loadMarketRanking(parsed.mode);
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "순위 데이터를 불러오는 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
