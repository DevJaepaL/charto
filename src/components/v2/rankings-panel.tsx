"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { formatChangeRate, formatPrice } from "@/lib/market-v2/compute";
import type { MarketId } from "@/lib/market-v2/sectors";
import type { RankingKind, RankingsPayload } from "@/lib/market-v2/view-types";
import { DemoNotice } from "@/components/v2/demo-notice";
import { changeColorClass } from "@/components/v2/price-format";

const KIND_TABS: Array<{ value: RankingKind; label: string }> = [
  { value: "gainers", label: "급상승" },
  { value: "losers", label: "급하락" },
  { value: "amount", label: "거래대금" },
];

const MARKET_TABS: Array<{ value: MarketId; label: string }> = [
  { value: "KR", label: "국내" },
  { value: "US", label: "미국" },
];

function formatTradingAmount(value: number | null, currency: string): string {
  if (value === null || !Number.isFinite(value)) {
    return "—";
  }
  if (currency === "USD") {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
    return `$${(value / 1e6).toFixed(0)}M`;
  }
  if (value >= 1e12) {
    return `${(value / 1e12).toFixed(1)}조원`;
  }
  return `${Math.round(value / 1e8).toLocaleString("ko-KR")}억원`;
}

export function RankingsPanel({ initialRankings }: { initialRankings: RankingsPayload }) {
  const [market, setMarket] = useState<MarketId>(initialRankings.market);
  const [kind, setKind] = useState<RankingKind>(initialRankings.kind);
  const [payloads, setPayloads] = useState<Record<string, RankingsPayload>>({
    [`${initialRankings.market}:${initialRankings.kind}`]: initialRankings,
  });
  const [isLoading, setIsLoading] = useState(false);

  const activeKey = `${market}:${kind}`;
  const payload = payloads[activeKey];

  const load = useCallback(
    async (targetMarket: MarketId, targetKind: RankingKind) => {
      const key = `${targetMarket}:${targetKind}`;
      if (payloads[key]) {
        return;
      }
      setIsLoading(true);
      try {
        const response = await fetch(`/api/v2/rankings?market=${targetMarket}&kind=${targetKind}`);
        if (!response.ok) {
          throw new Error(`rankings ${response.status}`);
        }
        const data = (await response.json()) as RankingsPayload;
        setPayloads((current) => ({ ...current, [key]: data }));
      } catch {
        // 실패 시 빈 상태 유지
      } finally {
        setIsLoading(false);
      }
    },
    [payloads],
  );

  useEffect(() => {
    void load(market, kind);
  }, [market, kind, load]);

  const rows = useMemo(() => payload?.rows.slice(0, 10) ?? [], [payload]);

  return (
    <section aria-label="종목 랭킹" className="surface-card rounded-[var(--radius-lg)] p-4 md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-[var(--text-main)]">오늘의 랭킹</h2>
          <DemoNotice show={payload?.isDemo ?? false} />
        </div>
        <div className="surface-pill flex rounded-[var(--radius-sm)] p-0.5" role="tablist" aria-label="시장 선택">
          {MARKET_TABS.map((tab) => (
            <button
              key={tab.value}
              aria-selected={market === tab.value}
              className={`rounded-[var(--radius-xs)] px-3 py-1 text-xs font-semibold transition-colors ${
                market === tab.value ? "brand-tab-active" : "text-[var(--text-soft)] brand-soft-hover"
              }`}
              onClick={() => setMarket(tab.value)}
              role="tab"
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 flex gap-1.5" role="tablist" aria-label="랭킹 종류">
        {KIND_TABS.map((tab) => (
          <button
            key={tab.value}
            aria-selected={kind === tab.value}
            className={`rounded-[var(--radius-sm)] border px-3 py-1.5 text-xs font-semibold transition-colors ${
              kind === tab.value
                ? "border-transparent brand-tab-active"
                : "border-[var(--line-soft)] text-[var(--text-soft)] brand-outline-hover"
            }`}
            onClick={() => setKind(tab.value)}
            role="tab"
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      <ol className="mt-3 divide-y divide-[var(--line-soft)]">
        {rows.map((row) => (
          <li key={row.symbol} className="market-row-hover flex items-center gap-3 px-1 py-2.5">
            <span className="w-5 shrink-0 text-center font-mono text-xs font-bold text-[var(--text-softest)]">
              {row.rank}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-[var(--text-main)]">{row.name}</p>
              <p className="text-[11px] text-[var(--text-softest)]">
                {row.symbol}
                {kind === "amount" ? ` · ${formatTradingAmount(row.tradingAmount, row.currency)}` : ""}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-mono text-[13px] font-bold text-[var(--text-main)]">
                {formatPrice(row.lastPrice, row.currency)}
              </p>
              <p className={`font-mono text-xs font-semibold ${changeColorClass(row.changeRate)}`}>
                {formatChangeRate(row.changeRate)}
              </p>
            </div>
          </li>
        ))}
        {rows.length === 0 && !isLoading ? (
          <li className="px-1 py-4 text-sm text-[var(--text-soft)]">랭킹을 불러오지 못했습니다.</li>
        ) : null}
        {rows.length === 0 && isLoading
          ? Array.from({ length: 5 }, (_, index) => (
              <li key={index} className="px-1 py-3">
                <div className="loading-skeleton h-8 rounded-[var(--radius-sm)] bg-[var(--surface-card-strong)]" />
              </li>
            ))
          : null}
      </ol>
    </section>
  );
}
