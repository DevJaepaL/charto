import { NextResponse } from "next/server";

import { hasTossCredentials } from "@/lib/toss/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    runtime: "nodejs",
    env: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
    config: {
      tossConfigured: hasTossCredentials(),
      dataMode: hasTossCredentials() ? "live" : "demo",
    },
  });
}
