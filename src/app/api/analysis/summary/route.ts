import { NextResponse } from "next/server";
import { z } from "zod";

import { generateAiSummary } from "@/lib/analysis/ai-summary";
import { getServerAuthSession } from "@/lib/auth";

const requestSchema = z.object({
  stock: z.object({
    symbol: z.string(),
    isin: z.string(),
    name: z.string(),
    market: z.enum(["KOSPI", "KOSDAQ", "KONEX"]),
  }),
  technical: z.object({
    currentPrice: z.number(),
    change: z.number(),
    changePercent: z.number(),
    sma5: z.number().nullable(),
    sma20: z.number().nullable(),
    sma60: z.number().nullable(),
    ema20: z.number().nullable(),
    rsi14: z.number().nullable(),
    macd: z.number().nullable(),
    macdSignal: z.number().nullable(),
    macdHistogram: z.number().nullable(),
    bollingerUpper: z.number().nullable(),
    bollingerMiddle: z.number().nullable(),
    bollingerLower: z.number().nullable(),
    bollingerPosition: z.number().nullable(),
    volumeAverage20: z.number().nullable(),
    volumeStatus: z.string(),
    support: z.number().nullable(),
    resistance: z.number().nullable(),
  }),
  signal: z.object({
    bias: z.enum(["bullish", "neutral", "bearish"]),
    score: z.number(),
    previousScore: z.number().nullable().optional(),
    scoreDelta: z.number().nullable().optional(),
    reasons: z.array(z.string()),
    risks: z.array(z.string()),
    support: z.number().nullable(),
    resistance: z.number().nullable(),
  }),
  companyContext: z
    .object({
      group: z.string().nullable(),
      instrumentLabel: z.string(),
      sector: z.string(),
      businessSummary: z.string(),
      industryFlow: z.string(),
      marketPosition: z.string(),
      confidence: z.enum(["high", "medium", "low"]),
      interpretWithCaution: z.boolean(),
      cautionNote: z.string().nullable(),
    })
    .optional(),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: "auth_required" }, { status: 401 });
    }

    const body = requestSchema.parse(await request.json());
    const summary = await generateAiSummary(
      body.stock,
      body.technical,
      body.signal,
      body.companyContext,
    );

    return NextResponse.json(summary);
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI 요약 생성 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
