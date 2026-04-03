"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IconBuildingBank, IconUsersGroup } from "@tabler/icons-react";

import { StockAvatar } from "@/components/stock-avatar";
import type { AccumulationResponse } from "@/lib/types";
import { formatKoreanWon, formatPercent } from "@/lib/utils";

async function getQuietAccumulation(signal: AbortSignal) {
  const response = await fetch("/api/market/accumulation?limit=6", {
    signal,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("조용한 매집 종목을 불러오지 못했습니다.");
  }

  return (await response.json()) as AccumulationResponse;
}

export function QuietAccumulationPanel() {
  const [payload, setPayload] = useState<AccumulationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    getQuietAccumulation(controller.signal)
      .then((nextPayload) => {
        setPayload(nextPayload);
        setError(null);
      })
      .catch((cause) => {
        if ((cause as Error).name === "AbortError") {
          return;
        }

        setError("조용한 매집 종목을 불러오지 못했습니다.");
      });

    return () => controller.abort();
  }, []);

  return (
    <section className="surface-card rounded-[20px] p-3.5 md:rounded-[22px] md:p-4.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 text-[11px] font-black tracking-[0.08em] text-[var(--brand-strong)] md:text-[12px]">
            <IconBuildingBank size={14} />
            <span>조용히 매집중인 종목</span>
          </div>
          <p className="mt-1.5 break-keep text-[12px] leading-5 text-slate-500 dark:text-slate-300 md:text-[13px]">
            최근 5거래일 동안 외인과 기관 수급이 함께 이어졌지만 주가가 아직 과열로 튀지 않은 종목이에요.
          </p>
        </div>
        <div className="rounded-full bg-[var(--surface-pill)] px-2.5 py-1 text-[10px] font-semibold text-slate-600 dark:bg-white/[0.06] dark:text-slate-200">
          최근 5일
        </div>
      </div>

      {error ? (
        <div className="mt-3 rounded-[14px] bg-[var(--surface-card-strong)] px-3 py-3 text-[12px] leading-5 text-slate-500 dark:bg-white/[0.04] dark:text-slate-300 md:text-[13px]">
          {error}
        </div>
      ) : null}

      {!error && !payload ? (
        <div className="mt-3 grid gap-2">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="h-[90px] animate-pulse rounded-[16px] bg-[var(--surface-card-strong)] dark:bg-white/[0.04]"
            />
          ))}
        </div>
      ) : null}

      {payload && !payload.items.length ? (
        <div className="mt-3 rounded-[14px] bg-[var(--surface-card-strong)] px-3 py-3 text-[12px] leading-5 text-slate-500 dark:bg-white/[0.04] dark:text-slate-300 md:text-[13px]">
          아직 조건에 맞는 종목이 많지 않아요. 장중 수급이 다시 들어오면 여기서 바로 보여드릴게요.
        </div>
      ) : null}

      {payload?.items.length ? (
        <div className="mt-3 grid gap-2.5">
          {payload.items.map((item) => (
            <Link
              key={item.stock.symbol}
              className="rounded-[16px] border border-[var(--line-soft)] bg-[var(--surface-card-strong)] px-3 py-3 transition-colors hover:bg-[var(--interactive-hover)] dark:bg-white/[0.03] dark:hover:bg-white/[0.05]"
              href={`/analyze/${item.stock.symbol}`}
            >
              <div className="flex items-start gap-3">
                <StockAvatar stock={item.stock} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-[14px] font-bold text-slate-900 dark:text-slate-50">
                        {item.stock.name}
                      </div>
                      <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                        {item.stock.symbol} · {item.stock.market}
                      </div>
                    </div>
                    <div className="rounded-full bg-white/80 px-2 py-1 text-[10px] font-semibold text-slate-600 dark:bg-white/[0.08] dark:text-slate-200">
                      {item.reason}
                    </div>
                  </div>

                  <div className="mt-2 grid gap-2 md:grid-cols-3">
                    <div className="rounded-[12px] bg-white/82 px-2.5 py-2 dark:bg-white/[0.04]">
                      <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                        <IconUsersGroup size={12} />
                        외인
                      </div>
                      <div className="mt-1 text-[13px] font-bold text-slate-900 dark:text-slate-50">
                        +{formatKoreanWon(item.foreignNetBuyAmount5d)}
                      </div>
                    </div>
                    <div className="rounded-[12px] bg-white/82 px-2.5 py-2 dark:bg-white/[0.04]">
                      <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                        기관
                      </div>
                      <div className="mt-1 text-[13px] font-bold text-slate-900 dark:text-slate-50">
                        +{formatKoreanWon(item.institutionNetBuyAmount5d)}
                      </div>
                    </div>
                    <div className="rounded-[12px] bg-white/82 px-2.5 py-2 dark:bg-white/[0.04]">
                      <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                        5일 등락률
                      </div>
                      <div className="mt-1 text-[13px] font-bold text-slate-900 dark:text-slate-50">
                        {formatPercent(item.priceChangePercent5d)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : null}

      {payload ? (
        <p className="mt-3 break-keep text-[11px] leading-5 text-slate-500 dark:text-slate-400">
          장중 수급은 추정치이며 업데이트 시점에 따라 수 분 차이가 날 수 있어요.
        </p>
      ) : null}
    </section>
  );
}
