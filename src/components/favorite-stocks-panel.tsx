"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IconStarFilled, IconX } from "@tabler/icons-react";

import { StockAvatar } from "@/components/stock-avatar";
import {
  getFavoritesEventName,
  readFavoriteStocks,
  readFavoriteStocksForUser,
  removeFavoriteStockForUser,
} from "@/lib/favorites";
import type { StockLookupItem } from "@/lib/types";

interface FavoriteStocksPanelProps {
  userKey: string | null;
  userName?: string | null;
}

export function FavoriteStocksPanel({ userKey, userName }: FavoriteStocksPanelProps) {
  const [items, setItems] = useState<StockLookupItem[]>(() =>
    userKey ? readFavoriteStocks(userKey) : [],
  );

  useEffect(() => {
    if (!userKey) {
      return;
    }

    let cancelled = false;

    const sync = () => {
      setItems(readFavoriteStocks(userKey));
    };

    void readFavoriteStocksForUser(userKey).then((nextItems) => {
      if (!cancelled) {
        setItems(nextItems);
      }
    });

    const handleStorage = (event: StorageEvent) => {
      if (event.key?.startsWith("charto:favorites:")) {
        sync();
      }
    };

    const handleCustom = (event: Event) => {
      const customEvent = event as CustomEvent<{ userKey?: string }>;
      if (!customEvent.detail?.userKey || customEvent.detail.userKey === userKey) {
        sync();
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(getFavoritesEventName(), handleCustom as EventListener);

    return () => {
      cancelled = true;
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(getFavoritesEventName(), handleCustom as EventListener);
    };
  }, [userKey]);

  if (!userKey) {
    return null;
  }

  return (
    <section className="surface-card mt-4 rounded-[16px] p-3 md:rounded-[20px] md:p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[11px] font-bold tracking-[0.06em] text-[var(--brand-strong)] md:text-[12px]">
            <IconStarFilled size={14} className="text-amber-500" />
            관심종목
          </div>
          <p className="mt-1 break-keep text-[12px] leading-5 text-slate-500 dark:text-slate-300 md:text-[13px]">
            {userName ? `${userName}님이 저장한 종목 목록` : "저장한 종목 목록"}
          </p>
        </div>
        <div className="rounded-full bg-[var(--surface-pill)] px-2 py-1 text-[10px] font-semibold text-slate-600 dark:bg-white/[0.06] dark:text-slate-200">
          {items.length}개
        </div>
      </div>

      {items.length ? (
        <div className="mt-3 grid gap-2">
          {items.map((item) => (
            <div
              key={item.symbol}
              className="flex items-center justify-between gap-3 rounded-[14px] bg-[var(--surface-card-strong)] px-3 py-2.5 dark:bg-white/[0.04]"
            >
              <Link className="flex min-w-0 flex-1 items-center gap-3" href={`/analyze/${item.symbol}`}>
                <StockAvatar stock={item} size="sm" />
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-semibold text-slate-900 dark:text-slate-50 md:text-[14px]">
                    {item.name}
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                    {item.symbol} · {item.market}
                  </div>
                </div>
              </Link>
              <button
                aria-label={`${item.name} 관심종목에서 제거`}
                className="brand-soft-hover inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-500 dark:text-slate-300"
                type="button"
                onClick={async () => {
                  setItems(await removeFavoriteStockForUser(userKey, item.symbol));
                }}
              >
                <IconX size={14} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-3 rounded-[14px] bg-[var(--surface-card-strong)] px-3 py-3 text-[12px] leading-5 text-slate-500 dark:bg-white/[0.04] dark:text-slate-300 md:text-[13px]">
          아직 관심종목이 없어요. 종목 상세에서 별표를 눌러 저장해 보세요.
        </div>
      )}
    </section>
  );
}
