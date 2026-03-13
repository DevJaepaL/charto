"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";

import { StockAvatar } from "@/components/stock-avatar";
import { formatCompactNumber, formatKoreanMarketCap, formatPercent, formatPrice } from "@/lib/utils";
import type { MarketRankMode, MarketRankingResponse } from "@/lib/types";

const MODES: Array<{ value: MarketRankMode; label: string; shortLabel: string }> = [
  { value: "value", label: "거래대금 상위", shortLabel: "거래대금" },
  { value: "volume", label: "거래량 상위", shortLabel: "거래량" },
  { value: "marketCap", label: "시가총액 상위", shortLabel: "시가총액" },
];

async function getRanking(mode: MarketRankMode) {
  const response = await fetch(`/api/market/rankings?mode=${mode}`);

  if (!response.ok) {
    throw new Error("순위 데이터를 불러오지 못했습니다.");
  }

  return (await response.json()) as MarketRankingResponse;
}

export function MarketPulsePanel() {
  const [activeMode, setActiveMode] = useState<MarketRankMode>("value");
  const [payloads, setPayloads] = useState<Partial<Record<MarketRankMode, MarketRankingResponse>>>(
    {},
  );
  const [error, setError] = useState<string | null>(null);
  const [visibleItems, setVisibleItems] = useState<Record<string, boolean>>({});
  const listRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef(new Map<string, HTMLAnchorElement | null>());

  useEffect(() => {
    let cancelled = false;

    Promise.all([getRanking("value"), getRanking("volume"), getRanking("marketCap")])
      .then(([value, volume, marketCap]) => {
        if (cancelled) {
          return;
        }

        setPayloads({
          value,
          volume,
          marketCap,
        });
        setError(null);
      })
      .catch(() => {
        if (!cancelled) {
          setError("실시간 순위 데이터를 불러오지 못했습니다.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const activePayload = payloads[activeMode];
  const itemLabel =
    activeMode === "volume"
      ? "거래량"
      : activeMode === "value"
        ? "거래대금"
        : "시가총액";

  useEffect(() => {
    if (!activePayload?.items.length || !listRef.current) {
      return;
    }

    const root = listRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          const key = (entry.target as HTMLElement).dataset.revealKey;
          if (!key) {
            return;
          }

          setVisibleItems((current) => (current[key] ? current : { ...current, [key]: true }));
          observer.unobserve(entry.target);
        });
      },
      {
        root,
        threshold: 0.12,
        rootMargin: "0px 0px -10% 0px",
      },
    );

    activePayload.items.forEach((item) => {
      const key = `${activeMode}-${item.stock.symbol}`;
      const element = itemRefs.current.get(key);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [activeMode, activePayload]);

  return (
    <div className="soft-panel rounded-[8px] p-0.75 md:rounded-[14px] md:p-1.25">
      <div className="text-[9px] font-bold text-slate-800 dark:text-slate-100 md:text-[11px]">
        <b>오늘 가장 많이 본 흐름</b>
      </div>

      <div className="mt-1.5 md:mt-2">
        <div className="grid grid-cols-3 gap-0.5 rounded-[7px] bg-[var(--surface-card-strong)] p-0.5 md:rounded-[9px]">
          {MODES.map((mode) => {
            const active = mode.value === activeMode;

            return (
              <button
                key={mode.value}
                className={`brand-soft-hover min-w-0 rounded-[6px] px-0.75 py-0.75 text-center text-[6.5px] font-bold leading-[1.05] md:px-1.5 md:py-1.5 md:text-[9px] ${
                  active ? "brand-tab-active" : "text-slate-500 dark:text-slate-300"
                }`}
                type="button"
                onClick={() => setActiveMode(mode.value)}
              >
                <span className="md:hidden">{mode.shortLabel}</span>
                <span className="hidden md:inline">{mode.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-[18px] surface-card px-4 py-5 text-sm text-slate-500 dark:text-slate-300">
          {error}
        </div>
      ) : null}

      {!error && !activePayload ? (
        <div className="mt-2 space-y-1.5">
          {Array.from({ length: 6 }, (_, index) => (
            <div
              key={index}
              className="h-[58px] animate-pulse rounded-[12px] surface-card md:h-[64px] md:rounded-[14px]"
            />
          ))}
        </div>
      ) : null}

      {activePayload ? (
        <div
          ref={listRef}
          className="surface-card scrollbar-visible mt-1.5 max-h-[224px] overflow-y-auto rounded-[8px] p-0.75 pr-0.75 md:mt-2 md:max-h-[288px] md:rounded-[12px]"
        >
          {activePayload.items.map((item, index) => (
            <Link
              key={`${activeMode}-${item.stock.symbol}`}
              ref={(element) => {
                itemRefs.current.set(`${activeMode}-${item.stock.symbol}`, element);
              }}
              data-reveal-key={`${activeMode}-${item.stock.symbol}`}
              style={
                {
                  "--reveal-delay": `${Math.min(index, 5) * 46}ms`,
                } as CSSProperties
              }
              className={`scroll-reveal-item market-row-hover block overflow-hidden rounded-[8px] px-1.5 py-1.5 transition-colors md:rounded-[12px] md:px-2.5 md:py-2.5 ${
                visibleItems[`${activeMode}-${item.stock.symbol}`] ? "is-visible" : ""
              } ${
                index !== activePayload.items.length - 1 ? "border-b border-[var(--line-soft)]" : ""
              }`}
              href={`/analyze/${item.stock.symbol}`}
            >
              <div className="flex items-start gap-2">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[rgba(var(--brand-rgb),0.1)] text-[7px] font-black text-[var(--brand-strong)] dark:bg-white/10 dark:text-slate-100 md:h-6 md:w-6 md:text-[9px]">
                  {item.rank}
                </div>
                <StockAvatar size="sm" stock={item.stock} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1 pr-1.5">
                      <div className="surface-hover-text overflow-hidden text-[11px] font-semibold leading-[1.22] text-slate-900 dark:text-slate-50 md:text-[13px] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
                        {item.stock.name}
                      </div>
                      <div className="mt-0.5 truncate text-[8px] text-slate-500 dark:text-slate-400 md:text-[10px]">
                        {item.stock.market} · {item.stock.symbol}
                      </div>
                    </div>
                    <div className="min-w-[92px] text-right md:min-w-[116px]">
                      <div className="surface-hover-text truncate text-[10px] font-bold tabular-nums text-slate-900 dark:text-slate-50 md:text-[12px]">
                        {formatPrice(item.price)}
                      </div>
                      <div
                        className={`mt-0.5 text-[8px] font-semibold tabular-nums md:text-[10px] ${
                          item.changePercent > 0
                            ? "text-[var(--price-up)]"
                            : item.changePercent < 0
                              ? "text-[var(--price-down)]"
                              : "text-slate-500 dark:text-slate-300"
                        }`}
                      >
                        {formatPercent(item.changePercent)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-0.75 flex items-center justify-between gap-2 text-[8px] text-slate-500 dark:text-slate-300 md:text-[10px]">
                    <span className="truncate">{itemLabel}</span>
                    <span className="truncate font-medium text-slate-600 dark:text-slate-200">
                      {activeMode === "volume"
                        ? `${formatCompactNumber(item.volume)}주`
                        : activeMode === "value"
                          ? `${formatCompactNumber(item.tradeValue)}원`
                          : `${formatKoreanMarketCap(item.marketCap ?? null)}`}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
