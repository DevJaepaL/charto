"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { StockAvatar } from "@/components/stock-avatar";
import { formatCompactNumber, formatKoreanWon, formatPercent, formatPrice } from "@/lib/utils";
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

  return (
    <div className="soft-panel rounded-[16px] p-1 md:rounded-[20px] md:p-2.5">
      <div>
        <div className="text-[11px] font-bold text-slate-800 dark:text-slate-100 md:text-[13px]">
          <b>오늘 가장 많이 본 흐름</b>
        </div>
        <p className="mt-0.5 text-[9px] leading-3.5 text-slate-500 dark:text-slate-300 md:text-[11px] md:leading-4.5">
          거래대금, 거래량, 시가총액 기준 상위 종목을 빠르게 확인합니다.
        </p>
      </div>
      <div className="mt-1.5 md:mt-2.5">
        <div className="grid grid-cols-3 gap-0.5 rounded-[10px] bg-[var(--surface-card-strong)] p-0.5">
          {MODES.map((mode) => {
            const active = mode.value === activeMode;
            return (
              <button
                key={mode.value}
                className={`brand-soft-hover min-w-0 rounded-[8px] px-0.5 py-0.5 text-center text-[7px] font-bold leading-3 md:px-1.5 md:py-1.5 md:text-[10px] ${
                  active
                    ? "brand-tab-active"
                    : "text-slate-500 dark:text-slate-300"
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
        <div className="mt-3 space-y-2">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="h-[64px] animate-pulse rounded-[16px] surface-card" />
          ))}
        </div>
      ) : null}

      {activePayload ? (
        <div className="scrollbar-visible mt-2 max-h-[260px] space-y-1 overflow-y-auto pr-1 md:mt-3 md:max-h-[360px] md:space-y-1.5">
          {activePayload.items.map((item) => (
            <Link
              key={`${activeMode}-${item.stock.symbol}`}
              className="surface-hover surface-card block overflow-hidden rounded-[12px] p-1.25 transition-colors md:rounded-[15px] md:p-2"
              href={`/analyze/${item.stock.symbol}`}
            >
              <div className="flex items-start gap-2">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[rgba(var(--brand-rgb),0.1)] text-[9px] font-black text-[var(--brand-strong)] dark:bg-white/10 dark:text-slate-100">
                  {item.rank}
                </div>
                <StockAvatar size="sm" stock={item.stock} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-2">
                    <div className="min-w-0 flex-1 pr-1">
                      <div className="surface-hover-text overflow-hidden text-[10px] font-semibold leading-3.5 text-slate-900 dark:text-slate-50 md:text-[11px] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
                        {item.stock.name}
                      </div>
                      <div className="mt-0.5 truncate text-[9px] text-slate-500 dark:text-slate-400 md:text-[10px]">
                        {item.stock.symbol} · {item.stock.market}
                      </div>
                    </div>
                    <div className="min-w-0 sm:min-w-[90px] sm:max-w-[104px] sm:text-right md:min-w-[96px]">
                      <div className="surface-hover-text truncate text-[9px] font-bold tabular-nums text-slate-900 dark:text-slate-50 md:text-[11px]">
                        {formatPrice(item.price)}
                      </div>
                      <div
                        className={`mt-0.5 text-[9px] font-semibold tabular-nums md:text-[10px] ${
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
                  <div className="mt-1 flex items-center gap-2 text-[9px] text-slate-500 dark:text-slate-300 md:text-[10px]">
                    <span className="surface-pill max-w-full truncate rounded-full px-1.5 py-0.5 font-medium dark:border-white/10 dark:bg-white/6">
                      {activeMode === "volume"
                        ? `누적 거래량 ${formatCompactNumber(item.volume)}주`
                        : activeMode === "value"
                          ? `누적 거래대금 ${formatCompactNumber(item.tradeValue)}원`
                          : `시가총액 ${formatKoreanWon(item.marketCap ?? null)}`}
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
