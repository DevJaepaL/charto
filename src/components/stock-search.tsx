"use client";

import { useDeferredValue, useEffect, useReducer, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { IconFlameFilled } from "@tabler/icons-react";

import { AnimatedLoadingStage } from "@/components/animated-loading-stage";
import { StockAvatar } from "@/components/stock-avatar";
import type { MarketRankingResponse, StockLookupItem } from "@/lib/types";

interface StockSearchProps {
  featured: StockLookupItem[];
  variant?: "hero" | "compact" | "inline";
}

async function getSuggestions(query: string, signal: AbortSignal) {
  const response = await fetch(`/api/market/search?q=${encodeURIComponent(query)}`, {
    signal,
  });

  if (!response.ok) {
    throw new Error("종목 검색에 실패했습니다.");
  }

  const payload = (await response.json()) as { items: StockLookupItem[] };
  return payload.items;
}

async function getTrendingStocks(signal: AbortSignal) {
  const response = await fetch("/api/market/rankings?mode=value", {
    signal,
  });

  if (!response.ok) {
    throw new Error("거래대금 상위 종목을 불러오지 못했어요.");
  }

  const payload = (await response.json()) as MarketRankingResponse;
  return payload.items.map((item) => item.stock);
}

type SearchState = {
  results: StockLookupItem[];
  error: string | null;
};

type SearchAction =
  | { type: "success"; items: StockLookupItem[] }
  | { type: "error"; message: string };

function searchReducer(state: SearchState, action: SearchAction): SearchState {
  switch (action.type) {
    case "success":
      return {
        results: action.items,
        error: null,
      };
    case "error":
      return {
        ...state,
        error: action.message,
      };
  }
}

export function StockSearch({ featured, variant = "hero" }: StockSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [searchState, dispatch] = useReducer(searchReducer, {
    results: featured,
    error: null,
  });
  const [trendingItems, setTrendingItems] = useState<StockLookupItem[]>(featured);
  const [isPending, startTransition] = useTransition();
  const [isFocused, setIsFocused] = useState(false);
  const [pendingTarget, setPendingTarget] = useState<StockLookupItem | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    getTrendingStocks(controller.signal)
      .then((items) => {
        if (items.length) {
          setTrendingItems(items);
        }
      })
      .catch(() => {
        setTrendingItems(featured);
      });

    return () => controller.abort();
  }, [featured]);

  useEffect(() => {
    const trimmed = deferredQuery.trim();
    if (!trimmed) {
      return;
    }

    const controller = new AbortController();
    getSuggestions(trimmed, controller.signal)
      .then((items) => {
        dispatch({ type: "success", items });
      })
      .catch((error) => {
        if ((error as Error).name === "AbortError") {
          return;
        }

        dispatch({ type: "error", message: "검색 결과를 불러오지 못했습니다." });
      });

    return () => controller.abort();
  }, [deferredQuery]);

  const activeItems = query.trim() ? searchState.results : trendingItems;

  const submitSearch = (item?: StockLookupItem) => {
    const target = item ?? activeItems[0];
    if (!target) {
      return;
    }

    setPendingTarget(target);
    startTransition(() => {
      router.push(`/analyze/${target.symbol}`);
    });
  };

  const compact = variant === "compact";
  const inline = variant === "inline";
  const hero = variant === "hero";

  return (
    <div className="w-full">
      <div
        className={`search-dock relative ${
          inline
            ? "rounded-[10px] p-0.5 md:rounded-[12px]"
            : compact
              ? "rounded-[14px] p-1 md:rounded-[16px]"
              : "rounded-[18px] p-1 md:rounded-[20px] md:p-1.5"
        }`}
      >
        <div
          className={`grid ${hero ? "grid-cols-1" : "grid-cols-[minmax(0,1fr)_auto]"} items-center border border-black/6 bg-white text-slate-900 dark:border-white/8 dark:bg-[#080d14] dark:text-white ${
            inline ? "rounded-[10px] md:rounded-[12px]" : compact ? "rounded-[12px] md:rounded-[14px]" : "rounded-[16px] md:rounded-[18px]"
          } ${
            inline ? "gap-1 p-1" : compact ? "gap-2 p-2" : "gap-2 p-2.5"
          }`}
        >
          <div className={`flex min-w-0 items-center ${inline ? "gap-1.5 px-2 py-1" : compact ? "gap-2 px-3.5 py-2.5" : "gap-3 px-4 py-3.5"}`}>
            <svg
              aria-hidden
              className={`${inline ? "size-3.5" : compact ? "size-4" : "size-4.5"} shrink-0 text-slate-400 dark:text-white/38`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35m1.35-5.15a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z" />
            </svg>
            <input
              aria-label="종목 검색"
              className={`w-full min-w-0 bg-transparent text-slate-900 outline-none placeholder:text-sm placeholder:text-slate-400 md:placeholder:text-base dark:text-white dark:placeholder:text-white/30 ${
                inline
                  ? "text-[12px] placeholder:text-[10px] md:text-[12px] md:placeholder:text-[11px]"
                    : compact
                      ? "text-[14px] placeholder:text-[11px] md:text-[15px] md:placeholder:text-[12px]"
                      : "text-[15px] placeholder:text-[12px] md:text-[16px] md:placeholder:text-[13px]"
              }`}
              placeholder="삼성전자 또는 005930"
              value={query}
              onBlur={() => setTimeout(() => setIsFocused(false), 120)}
              onChange={(event) => setQuery(event.target.value)}
              onFocus={() => setIsFocused(true)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  submitSearch();
                }
              }}
            />
          </div>
          {!hero && !inline ? (
            <button
              className={`brand-button shrink-0 whitespace-nowrap rounded-[10px] font-semibold ${
                inline
                  ? "px-2 py-1 text-[10px] min-w-[52px]"
                  : compact
                    ? "px-4 py-2 text-[12px] min-w-[86px]"
                    : "px-5 py-2.5 text-[13px] min-w-[112px]"
              }`}
              type="button"
              onClick={() => submitSearch()}
            >
              {isPending ? "이동 중..." : "분석 보기"}
            </button>
          ) : null}
        </div>

        {isPending && pendingTarget ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[inherit] bg-[rgba(247,244,238,0.92)] backdrop-blur-sm dark:bg-[rgba(8,13,20,0.92)]">
            <AnimatedLoadingStage compact stock={pendingTarget} />
          </div>
        ) : null}

        {(isFocused || query.trim()) && (
          <div className="mt-2 rounded-[18px] border border-black/8 bg-[rgba(255,255,255,0.98)] p-2.5 text-slate-900 shadow-[0_18px_42px_rgba(13,20,33,0.1)] md:rounded-[20px] dark:border-white/8 dark:bg-[#080d14] dark:text-white dark:shadow-[0_18px_42px_rgba(3,7,14,0.24)]">
            <div className="flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-500 dark:text-white/56">
              <span className="inline-flex items-center gap-1.5">
                {!query.trim() ? <IconFlameFilled size={12} className="text-orange-500" /> : null}
                <span>{query.trim() ? "검색 결과" : "많은 사람들이 검색한 종목이에요."}</span>
              </span>
              {query.trim() && searchState.error ? (
                <span className="text-rose-500">{searchState.error}</span>
              ) : null}
            </div>
            <div className="scrollbar-visible grid max-h-[min(56vh,420px)] gap-1 overflow-y-auto pr-1">
              {activeItems.map((item) => (
                <button
                  key={`${item.market}-${item.symbol}`}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-[14px] border border-black/5 bg-[rgba(248,249,251,0.96)] px-3.5 py-3 text-left transition-colors hover:bg-slate-50 md:rounded-[16px] dark:border-white/6 dark:bg-white/[0.02] dark:hover:bg-white/[0.05]"
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => submitSearch(item)}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <StockAvatar size="sm" stock={item} />
                    <div className="min-w-0">
                      <div className="overflow-hidden text-sm font-semibold leading-5 text-slate-900 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] dark:text-white">
                        {item.name}
                      </div>
                      <div className="mt-1 truncate text-xs text-slate-500 sm:text-sm dark:text-white/54">
                        <span>{item.symbol}</span>
                        <span className="mx-1">·</span>
                        <span>{item.market}</span>
                      </div>
                    </div>
                  </div>
                  <div className="hidden text-xs font-semibold text-slate-400 sm:inline-flex dark:text-white/28">
                    →
                  </div>
                </button>
              ))}
              {!activeItems.length ? (
                <div className="rounded-[18px] px-3 py-6 text-center text-sm text-slate-500 dark:text-white/54">
                  일치하는 종목이 없습니다.
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
