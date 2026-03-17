import { NextResponse } from "next/server";
import { z } from "zod";

import { getServerAuthSession } from "@/lib/auth";
import { getSupabaseAdminClient, isSupabaseConfigured } from "@/lib/supabase";
import type { MarketName, StockLookupItem } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stockSchema = z.object({
  symbol: z.string().trim().min(1).max(16),
  isin: z.string().trim().min(1).max(32),
  name: z.string().trim().min(1).max(120),
  market: z.enum(["KOSPI", "KOSDAQ", "KONEX"] satisfies [MarketName, ...MarketName[]]),
});

const deleteSchema = z.object({
  symbol: z.string().trim().min(1).max(16),
});

type FavoriteRow = {
  symbol: string;
  isin: string;
  name: string;
  market: MarketName;
};

function toStockLookupItem(row: FavoriteRow): StockLookupItem {
  return {
    symbol: row.symbol,
    isin: row.isin,
    name: row.name,
    market: row.market,
  };
}

function getSessionUserKey(session: Awaited<ReturnType<typeof getServerAuthSession>>) {
  return session?.user?.id?.trim() || null;
}

async function getFavoriteStocksFromDb(userKey: string) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    throw new Error("supabase_not_configured");
  }

  const { data, error } = await supabase
    .from("favorite_stocks")
    .select("symbol, isin, name, market")
    .eq("user_key", userKey)
    .order("created_at", { ascending: false })
    .limit(24);

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => toStockLookupItem(row as FavoriteRow));
}

export async function GET() {
  const session = await getServerAuthSession();
  const userKey = getSessionUserKey(session);

  if (!userKey) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase가 설정되지 않았습니다.", fallback: "local" },
      { status: 503 },
    );
  }

  try {
    const items = await getFavoriteStocksFromDb(userKey);
    return NextResponse.json({ items, source: "supabase" });
  } catch (error) {
    console.error("[favorites][GET]", error);
    return NextResponse.json(
      { error: "관심종목을 불러오지 못했습니다.", fallback: "local" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const session = await getServerAuthSession();
  const userKey = getSessionUserKey(session);

  if (!userKey) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase가 설정되지 않았습니다.", fallback: "local" },
      { status: 503 },
    );
  }

  const payload = await request.json().catch(() => null);
  const result = stockSchema.safeParse(payload);

  if (!result.success) {
    return NextResponse.json({ error: "잘못된 관심종목 요청입니다." }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase가 설정되지 않았습니다.", fallback: "local" },
      { status: 503 },
    );
  }

  try {
    const { error } = await supabase.from("favorite_stocks").upsert(
      {
        user_key: userKey,
        user_name: session?.user?.name?.trim() || null,
        symbol: result.data.symbol,
        isin: result.data.isin,
        name: result.data.name,
        market: result.data.market,
      },
      { onConflict: "user_key,symbol" },
    );

    if (error) {
      throw error;
    }

    const items = await getFavoriteStocksFromDb(userKey);
    return NextResponse.json({ items, source: "supabase" });
  } catch (error) {
    console.error("[favorites][POST]", error);
    return NextResponse.json(
      { error: "관심종목 저장에 실패했습니다.", fallback: "local" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const session = await getServerAuthSession();
  const userKey = getSessionUserKey(session);

  if (!userKey) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase가 설정되지 않았습니다.", fallback: "local" },
      { status: 503 },
    );
  }

  const payload = await request.json().catch(() => null);
  const result = deleteSchema.safeParse(payload);

  if (!result.success) {
    return NextResponse.json({ error: "잘못된 관심종목 요청입니다." }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase가 설정되지 않았습니다.", fallback: "local" },
      { status: 503 },
    );
  }

  try {
    const { error } = await supabase
      .from("favorite_stocks")
      .delete()
      .eq("user_key", userKey)
      .eq("symbol", result.data.symbol);

    if (error) {
      throw error;
    }

    const items = await getFavoriteStocksFromDb(userKey);
    return NextResponse.json({ items, source: "supabase" });
  } catch (error) {
    console.error("[favorites][DELETE]", error);
    return NextResponse.json(
      { error: "관심종목 삭제에 실패했습니다.", fallback: "local" },
      { status: 500 },
    );
  }
}
