import { NextResponse } from "next/server";

import { searchStocks } from "@/lib/stock-master";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";

  return NextResponse.json({
    items: searchStocks(query, 12),
  });
}
