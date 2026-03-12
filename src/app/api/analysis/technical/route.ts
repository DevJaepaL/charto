import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { loadTechnicalResponse } from "@/lib/analysis/load-analysis-data";
import { candlesQuerySchema } from "@/lib/market/provider";

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
    const response = await loadTechnicalResponse(parsed.symbol, parsed.interval, parsed.range);

    return NextResponse.json(response);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "기술 분석 데이터를 계산하는 중 오류가 발생했습니다.";
    const status =
      message === "등록되지 않은 종목 코드입니다."
        ? 404
        : error instanceof ZodError
          ? 400
          : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
