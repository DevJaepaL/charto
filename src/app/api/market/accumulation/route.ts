import { NextResponse } from "next/server";
import { z } from "zod";

import { loadQuietAccumulation } from "@/lib/market/accumulation";

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(24).default(12),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = querySchema.parse({
      limit: searchParams.get("limit") ?? undefined,
    });

    const payload = await loadQuietAccumulation(parsed.limit);
    return NextResponse.json(payload);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "수급 데이터를 불러오는 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
