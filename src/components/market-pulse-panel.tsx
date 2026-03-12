"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { StockAvatar } from "@/components/stock-avatar";
import { formatCompactNumber, formatKoreanWon, formatPercent, formatPrice } from "@/lib/utils";
import type { MarketRankMode, MarketRankingResponse } from "@/lib/types";

const MODES: Array<{ value: MarketRankMode; label: string }> = [
  { value: "value", label: "거래대금 상위" },
  { value: "volume", label: "거래량 상위" },
  { value: "marketCap", label: "시가총액 상위" },
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
    <div className="soft-panel rounded-[20px] p-2 md:rounded-[22px] md:p-3">
      <div>
        <div className="text-[13px] font-bold text-slate-800 dark:text-slate-100 md:text-sm">
          <b>오늘 가장 많이 본 흐름</b>
        </div>
        <p className="mt-1 text-[11px] leading-4.5 text-slate-500 dark:text-slate-300 md:text-xs md:leading-5">
          거래대금, 거래량, 시가총액 기준 상위 종목을 빠르게 확인합니다.
        </p>
      </div>
      <div className="mt-2.5 md:mt-3">
        <div className="grid grid-cols-3 gap-1 rounded-[16px] bg-[var(--surface-card-strong)] p-1">
          {MODES.map((mode) => {
            const active = mode.value === activeMode;
            return (
              <button
                key={mode.value}
                className={`brand-soft-hover min-w-0 rounded-[12px] px-1.5 py-1 text-center text-[10px] font-bold leading-3.5 md:px-2 md:py-1.5 md:text-[11px] ${
                  active
                    ? "brand-tab-active"
                    : "text-slate-500 dark:text-slate-300"
                }`}
                type="button"
                onClick={() => setActiveMode(mode.value)}
              >
                {mode.label}
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
        <div className="mt-4 space-y-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="h-[82px] animate-pulse rounded-[20px] surface-card" />
          ))}
        </div>
      ) : null}

      {activePayload ? (
        <div className="scrollbar-visible mt-3 max-h-[380px] space-y-1.5 overflow-y-auto pr-2 md:mt-4 md:max-h-[440px] md:space-y-2">
          {activePayload.items.map((item) => (
            <Link
              key={`${activeMode}-${item.stock.symbol}`}
              className="surface-hover surface-card block overflow-hidden rounded-[15px] p-2 transition-colors md:rounded-[16px] md:p-2.5"
              href={`/analyze/${item.stock.symbol}`}
            >
              <div className="flex items-start gap-2.5">
                <div className="flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-full bg-[rgba(var(--brand-rgb),0.1)] text-[10px] font-black text-[var(--brand-strong)] dark:bg-white/10 dark:text-slate-100">
                  {item.rank}
                </div>
                <StockAvatar size="sm" stock={item.stock} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                    <div className="min-w-0 flex-1 pr-1">
                      <div className="surface-hover-text overflow-hidden text-[11px] font-semibold leading-4 text-slate-900 dark:text-slate-50 md:text-[12px] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
                        {item.stock.name}
                      </div>
                      <div className="mt-1 truncate text-[10px] text-slate-500 dark:text-slate-400 md:text-[11px]">
                        {item.stock.symbol} · {item.stock.market}
                      </div>
                    </div>
                    <div className="min-w-0 sm:min-w-[96px] sm:max-w-[112px] sm:text-right md:min-w-[104px]">
                      <div className="surface-hover-text truncate text-[10px] font-bold tabular-nums text-slate-900 dark:text-slate-50 md:text-[12px]">
                        {formatPrice(item.price)}
                      </div>
                      <div
                        className={`mt-0.5 text-[10px] font-semibold tabular-nums md:text-[11px] ${
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
                  <div className="mt-1.5 flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-300 md:text-[11px]">
                    <span className="surface-pill max-w-full truncate rounded-full px-2 py-1 font-medium dark:border-white/10 dark:bg-white/6">
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
