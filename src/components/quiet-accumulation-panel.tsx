"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IconBuildingBank, IconBuilding, IconGlobe } from "@tabler/icons-react";

import { StockAvatar } from "@/components/stock-avatar";
import type { AccumulationResponse } from "@/lib/types";
import { formatPercent } from "@/lib/utils";

const HOME_ACCUMULATION_LIMIT = 12;

function formatSignedNetBuyAmount(value: number) {
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  const absolute = Math.abs(value);

  if (absolute >= 1_0000_0000_0000) {
    return `${sign}${(absolute / 1_0000_0000_0000).toFixed(1).replace(/\.0$/, "")}조`;
  }

  if (absolute >= 1_0000_0000) {
    return `${sign}${(absolute / 1_0000_0000).toFixed(1).replace(/\.0$/, "")}억`;
  }

  if (absolute >= 1_0000) {
    return `${sign}${(absolute / 1_0000).toFixed(1).replace(/\.0$/, "")}만`;
  }

  return `${sign}${Math.round(absolute).toLocaleString("ko-KR")}원`;
}

function getPriceChangeTone(value: number | null) {
  if (value === null) {
    return {
      tile: "border-slate-300/70 bg-slate-100/90 dark:border-white/[0.08] dark:bg-white/[0.05]",
      label: "text-slate-500 dark:text-slate-400",
      value: "text-slate-700 dark:text-slate-200",
    };
  }

  if (value < 0) {
    return {
      tile: "border-sky-500/14 bg-sky-500/[0.09] dark:border-sky-400/18 dark:bg-sky-400/[0.1]",
      label: "text-sky-700 dark:text-sky-200",
      value: "text-[var(--price-down)] dark:text-sky-300",
    };
  }

  return {
    tile: "border-rose-500/14 bg-rose-500/[0.08] dark:border-rose-400/18 dark:bg-rose-400/[0.1]",
    label: "text-rose-700 dark:text-rose-200",
    value: "text-[var(--price-up)] dark:text-rose-200",
  };
}

function getFlowTone(streak: number, direction: "buy" | "sell" | "mixed") {
  if (direction === "buy") {
    if (streak >= 7) {
      return "border-emerald-600/28 bg-emerald-600/18 text-emerald-900 dark:border-emerald-300/24 dark:bg-emerald-400/22 dark:text-emerald-100";
    }

    if (streak >= 4) {
      return "border-emerald-500/24 bg-emerald-500/14 text-emerald-800 dark:border-emerald-300/20 dark:bg-emerald-400/18 dark:text-emerald-100";
    }

    return "border-emerald-500/18 bg-emerald-500/10 text-emerald-800 dark:border-emerald-300/16 dark:bg-emerald-400/12 dark:text-emerald-100";
  }

  if (direction === "sell") {
    if (streak >= 7) {
      return "border-sky-600/28 bg-sky-600/18 text-sky-900 dark:border-sky-300/24 dark:bg-sky-400/22 dark:text-sky-100";
    }

    if (streak >= 4) {
      return "border-sky-500/24 bg-sky-500/14 text-sky-800 dark:border-sky-300/20 dark:bg-sky-400/18 dark:text-sky-100";
    }

    return "border-sky-500/18 bg-sky-500/10 text-sky-800 dark:border-sky-300/16 dark:bg-sky-400/12 dark:text-sky-100";
  }

  return "border-[rgba(var(--brand-rgb),0.12)] bg-[rgba(var(--brand-rgb),0.07)] text-[var(--brand-strong)] dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-slate-200";
}

function getFlowSummary(
  buyStreak: number,
  sellStreak: number,
  positiveDays: number,
  netBuyAmount5d: number,
  windowDays: number,
) {
  if (buyStreak > 0) {
    return {
      headline: `${buyStreak}일 연속`,
      detail: "순매수",
      tone: getFlowTone(buyStreak, "buy"),
    };
  }

  if (sellStreak > 0) {
    return {
      headline: `${sellStreak}일 연속`,
      detail: "순매도",
      tone: getFlowTone(sellStreak, "sell"),
    };
  }

  if (netBuyAmount5d > 0) {
    return {
      headline: `최근 ${windowDays}일`,
      detail: `${positiveDays}일 매수`,
      tone: getFlowTone(0, "mixed"),
    };
  }

  if (netBuyAmount5d < 0) {
    return {
      headline: `최근 ${windowDays}일`,
      detail: "누적 순매도",
      tone: getFlowTone(0, "mixed"),
    };
  }

  return {
    headline: "연속 없음",
    detail: "방향 혼조",
    tone: getFlowTone(0, "mixed"),
  };
}

async function getQuietAccumulation(signal: AbortSignal) {
  const response = await fetch(`/api/market/accumulation?limit=${HOME_ACCUMULATION_LIMIT}`, {
    signal,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("외인·기관 수급 종목을 불러오지 못했습니다.");
  }

  return (await response.json()) as AccumulationResponse;
}

export function QuietAccumulationPanel() {
  const [payload, setPayload] = useState<AccumulationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sectionTitle = payload?.label ?? "💵 외인·기관의 매수세가 이어지는 종목";
  const sectionDescription = payload?.notice ?? "최근 외인과 기관이 꾸준히 매수하고 있는 종목이에요.";
  const metricTileBase =
    "min-w-0 rounded-[14px] border px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] dark:shadow-none";
  const metricLabelBase = "block text-[10px] font-semibold leading-none";
  const metricValueBase =
    "mt-1.5 truncate text-[12px] font-bold leading-none tracking-[-0.02em] text-slate-950 tabular-nums dark:text-slate-50 md:text-[13px]";

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

        setError("외인·기관 수급 종목을 불러오지 못했습니다.");
      });

    return () => controller.abort();
  }, []);

  return (
    <section className="surface-card rounded-[20px] p-3.5 md:rounded-[22px] md:p-4.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 text-[11px] font-black tracking-[0.08em] text-[var(--brand-strong)] md:text-[12px]">
            <IconBuildingBank size={14} />
            <span>{sectionTitle}</span>
          </div>
          <p className="mt-1.5 break-keep text-[12px] leading-5 text-slate-500 dark:text-slate-300 md:text-[13px]">
            {sectionDescription}
          </p>
        </div>
        <div className="rounded-full bg-[var(--surface-pill)] px-2.5 py-1 text-[10px] font-semibold text-slate-600 dark:bg-white/[0.06] dark:text-slate-200">
          최근 {payload?.windowDays ?? 5}일
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
          지금은 외인과 기관이 함께 꾸준히 들어오는 종목이 많지 않아요. 흐름이 강해지면 여기서 바로 보여드릴게요.
        </div>
      ) : null}

      {payload?.items.length ? (
        <div className="scrollbar-visible mt-3 max-h-[36rem] overflow-y-auto pr-1 md:max-h-[42rem]">
          <div className="grid gap-2.5">
            {payload.items.map((item) => {
              const priceChangeTone = getPriceChangeTone(item.priceChangePercent5d);
              const foreignFlow = getFlowSummary(
                item.foreignBuyStreak,
                item.foreignSellStreak,
                item.foreignPositiveDays,
                item.foreignNetBuyAmount5d,
                payload.windowDays,
              );
              const institutionFlow = getFlowSummary(
                item.institutionBuyStreak,
                item.institutionSellStreak,
                item.institutionPositiveDays,
                item.institutionNetBuyAmount5d,
                payload.windowDays,
              );

              return (
                <Link
                  key={item.stock.symbol}
                  className="group rounded-[18px] border border-[rgba(var(--brand-rgb),0.12)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,249,252,0.98))] px-3.5 py-3.5 shadow-[0_14px_30px_rgba(15,23,42,0.06)] transition-all hover:border-[var(--interactive-border)] hover:bg-[var(--interactive-hover)] hover:shadow-[0_18px_34px_rgba(15,23,42,0.08)] dark:border-white/[0.08] dark:bg-[linear-gradient(180deg,rgba(15,18,24,0.98),rgba(10,13,19,0.98))] dark:hover:bg-white/[0.05]"
                  href={`/analyze/${item.stock.symbol}`}
                >
                  <div className="flex items-start gap-3.5">
                    <StockAvatar stock={item.stock} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="min-w-0">
                        <div className="min-w-0">
                          <div className="line-clamp-2 break-keep text-[15px] font-bold leading-[1.28] text-slate-900 dark:text-slate-50">
                            {item.stock.name}
                          </div>
                          <div className="mt-1 inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                            <span className="tabular-nums">{item.stock.symbol}</span>
                            <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                            <span>{item.stock.market}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2.5">
                        <div className={`rounded-[14px] border px-3 py-2.5 ${foreignFlow.tone}`}>
                          <div className="inline-flex items-center gap-1.5 text-[10px] font-semibold leading-none">
                            <IconGlobe size={12} stroke={1.8} />
                            <span>외인</span>
                          </div>
                          <div className="mt-1.5 text-[13px] font-bold leading-none">{foreignFlow.headline}</div>
                          <div className="mt-1 text-[10px] font-semibold leading-none opacity-90">{foreignFlow.detail}</div>
                        </div>
                        <div className={`rounded-[14px] border px-3 py-2.5 ${institutionFlow.tone}`}>
                          <div className="inline-flex items-center gap-1.5 text-[10px] font-semibold leading-none">
                            <IconBuilding size={12} stroke={1.8} />
                            <span>기관</span>
                          </div>
                          <div className="mt-1.5 text-[13px] font-bold leading-none">{institutionFlow.headline}</div>
                          <div className="mt-1 text-[10px] font-semibold leading-none opacity-90">{institutionFlow.detail}</div>
                        </div>
                      </div>

                      <div className="mt-2.5 grid grid-cols-3 gap-2.5">
                        <div
                          className={`${metricTileBase} ${item.foreignNetBuyAmount5d < 0 ? "border-sky-500/14 bg-sky-500/[0.09] dark:border-sky-400/18 dark:bg-sky-400/[0.1]" : "border-emerald-500/14 bg-emerald-500/[0.08] dark:border-emerald-400/18 dark:bg-emerald-400/[0.08]"}`}
                        >
                          <div
                            className={`${metricLabelBase} ${item.foreignNetBuyAmount5d < 0 ? "text-sky-700 dark:text-sky-200" : "text-emerald-700 dark:text-emerald-200"}`}
                          >
                            외인
                          </div>
                          <div className={`${metricValueBase} ${item.foreignNetBuyAmount5d < 0 ? "text-[var(--price-down)] dark:text-sky-300" : "text-emerald-700 dark:text-emerald-200"}`}>
                            {formatSignedNetBuyAmount(item.foreignNetBuyAmount5d)}
                          </div>
                        </div>
                        <div
                          className={`${metricTileBase} ${item.institutionNetBuyAmount5d < 0 ? "border-sky-500/14 bg-sky-500/[0.09] dark:border-sky-400/18 dark:bg-sky-400/[0.1]" : "border-emerald-500/14 bg-emerald-500/[0.08] dark:border-emerald-400/18 dark:bg-emerald-400/[0.08]"}`}
                        >
                          <div
                            className={`${metricLabelBase} ${item.institutionNetBuyAmount5d < 0 ? "text-sky-700 dark:text-sky-200" : "text-emerald-700 dark:text-emerald-200"}`}
                          >
                            기관
                          </div>
                          <div
                            className={`${metricValueBase} ${item.institutionNetBuyAmount5d < 0 ? "text-[var(--price-down)] dark:text-sky-300" : "text-emerald-700 dark:text-emerald-200"}`}
                          >
                            {formatSignedNetBuyAmount(item.institutionNetBuyAmount5d)}
                          </div>
                        </div>
                        <div className={`${metricTileBase} ${priceChangeTone.tile}`}>
                          <div className={`${metricLabelBase} ${priceChangeTone.label}`}>
                            5일 등락률
                          </div>
                          <div className={`${metricValueBase} ${priceChangeTone.value}`}>
                            {formatPercent(item.priceChangePercent5d)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
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
