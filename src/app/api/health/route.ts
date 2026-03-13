import { NextResponse } from "next/server";

import { getGeminiApiKeyCount } from "@/lib/analysis/ai-summary";
import { isAuthEnabled } from "@/lib/auth";
import { hasKisCredentials } from "@/lib/market/provider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function hasOpenDartApiKey() {
  return Boolean(
    process.env.OPENDART_API_KEY?.trim() ||
      process.env.OPEN_DART_API_KEY?.trim() ||
      process.env.DART_API_KEY?.trim(),
  );
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    runtime: "nodejs",
    env: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
    config: {
      kisConfigured: hasKisCredentials(),
      kisEnv: process.env.KIS_ENV === "demo" ? "demo" : "real",
      geminiKeyCount: getGeminiApiKeyCount(),
      openDartConfigured: hasOpenDartApiKey(),
      authEnabled: isAuthEnabled,
    },
  });
}
