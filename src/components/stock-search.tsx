"use client";

import { useDeferredValue, useEffect, useReducer, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

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

async function getLiveFeatured(signal: AbortSignal) {
  const response = await fetch("/api/market/rankings?mode=value", { signal });

  if (!response.ok) {
    throw new Error("실시간 거래대금 상위 데이터를 불러오지 못했습니다.");
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
  const [liveFeatured, setLiveFeatured] = useState<StockLookupItem[]>(featured);
  const [isPending, startTransition] = useTransition();
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    getLiveFeatured(controller.signal)
      .then((items) => {
        if (items.length) {
          setLiveFeatured(items);
        }
      })
      .catch(() => {
        setLiveFeatured(featured);
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

  const activeItems = query.trim() ? searchState.results : liveFeatured;

  const submitSearch = (item?: StockLookupItem) => {
    const target = item ?? activeItems[0];
    if (!target) {
      return;
    }

    startTransition(() => {
      router.push(`/analyze/${target.symbol}`);
    });
  };

  const compact = variant === "compact";
  const inline = variant === "inline";

  return (
    <div className={compact || inline ? "w-full" : "w-full max-w-3xl"}>
      <div
        className={`glass-card relative rounded-[var(--radius-xl)] ${
          inline ? "p-1" : compact ? "p-1" : "p-4 md:p-5"
        }`}
      >
        <div
          className={`flex flex-col rounded-[22px] bg-[var(--surface-card)] sm:flex-row sm:items-center ${
            inline ? "gap-2 p-1.5" : "gap-3 p-2"
          }`}
        >
          <div className={`flex min-w-0 flex-1 items-center ${inline ? "gap-2.5 px-2.5 py-1.5" : "gap-3 px-3 py-2"}`}>
            <svg
              aria-hidden
              className={`${inline ? "size-4.5" : "size-5"} shrink-0 text-slate-400 dark:text-slate-500`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35m1.35-5.15a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z" />
            </svg>
            <input
              aria-label="종목 검색"
              className={`w-full min-w-0 bg-transparent text-slate-900 outline-none placeholder:text-sm placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500 md:placeholder:text-base ${
                inline
                  ? "text-sm placeholder:text-xs md:text-sm md:placeholder:text-sm"
                  : compact
                    ? "text-sm md:text-base"
                    : "text-base md:text-lg"
              }`}
              placeholder="종목명 또는 종목코드 검색"
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
          <button
            className={`brand-button shrink-0 whitespace-nowrap rounded-lg font-semibold ${
              inline
                ? "px-3.5 py-2 text-xs sm:min-w-[72px]"
                : "px-5 py-3 text-sm sm:min-w-[88px]"
            }`}
            type="button"
            onClick={() => submitSearch()}
          >
            {isPending ? "이동 중..." : "검색"}
          </button>
        </div>

        {(isFocused || query.trim()) && (
          <div className="surface-card mt-3 rounded-[24px] p-2">
            <div className="flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-500 dark:text-slate-300">
              <span>{query.trim() ? "검색 결과" : "실시간 거래대금 상위"}</span>
              {query.trim() && searchState.error ? (
                <span className="text-rose-500">{searchState.error}</span>
              ) : null}
            </div>
            <div className="scrollbar-visible grid max-h-[min(56vh,420px)] gap-1 overflow-y-auto pr-1">
              {activeItems.map((item) => (
                <button
                  key={`${item.market}-${item.symbol}`}
                  className="brand-soft-hover grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-[18px] px-3 py-3 text-left transition-colors"
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => submitSearch(item)}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <StockAvatar size="sm" stock={item} />
                    <div className="min-w-0">
                      <div className="overflow-hidden text-sm font-semibold leading-5 text-slate-900 dark:text-slate-100 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
                        {item.name}
                      </div>
                      <div className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
                        {item.symbol} · {item.market}
                      </div>
                    </div>
                  </div>
                  <div className="surface-pill hidden rounded-full px-2.5 py-1 text-xs font-medium text-slate-600 dark:border-white/10 dark:bg-white/6 dark:text-slate-200 sm:inline-flex">
                    보기
                  </div>
                </button>
              ))}
              {!activeItems.length ? (
                <div className="rounded-[18px] px-3 py-6 text-center text-sm text-slate-500 dark:text-slate-300">
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
