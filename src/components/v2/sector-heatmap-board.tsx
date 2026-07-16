"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { formatChangeRate, HEATMAP_PERIODS, type HeatmapPeriod } from "@/lib/market-v2/compute";
import type { MarketId } from "@/lib/market-v2/sectors";
import type { HeatmapPayload, SectorHeatmapTile } from "@/lib/market-v2/view-types";
import { DemoNotice } from "@/components/v2/demo-notice";
import { changeColorClass, heatmapTileBackground } from "@/components/v2/price-format";

const MARKET_TABS: Array<{ value: MarketId; label: string }> = [
  { value: "KR", label: "국내" },
  { value: "US", label: "미국" },
];

function sortTiles(tiles: SectorHeatmapTile[], period: HeatmapPeriod): SectorHeatmapTile[] {
  return [...tiles].sort((a, b) => {
    const left = a.returns[period];
    const right = b.returns[period];
    if (left === null && right === null) return 0;
    if (left === null) return 1;
    if (right === null) return -1;
    return right - left;
  });
}

function HeatmapTile({ tile, period }: { tile: SectorHeatmapTile; period: HeatmapPeriod }) {
  const rate = tile.returns[period];

  return (
    <Link
      className="group flex min-h-[5.5rem] flex-col justify-between rounded-[8px] border border-[var(--line-soft)] p-3 transition-transform hover:-translate-y-0.5"
      href={`/sector/${tile.market}/${tile.slug}`}
      style={{ background: heatmapTileBackground(rate) }}
    >
      <div className="flex items-start justify-between gap-1">
        <span className="text-[13px] font-bold leading-tight text-[var(--text-main)]">{tile.shortName}</span>
        <span className="text-[10px] font-semibold text-[var(--text-softest)]">{tile.etfSymbol}</span>
      </div>
      <div className="flex items-end justify-between gap-1">
        <span className={`font-mono text-lg font-bold tracking-tight ${changeColorClass(rate)}`}>
          {formatChangeRate(rate)}
        </span>
      </div>
    </Link>
  );
}

function HighlightList({
  title,
  tiles,
  period,
}: {
  title: string;
  tiles: SectorHeatmapTile[];
  period: HeatmapPeriod;
}) {
  return (
    <div className="surface-card-strong flex-1 rounded-[8px] p-3.5">
      <h3 className="text-xs font-bold text-[var(--text-soft)]">{title}</h3>
      <ol className="mt-2.5 space-y-2">
        {tiles.map((tile) => (
          <li key={tile.slug}>
            <Link
              className="flex items-center justify-between gap-2 rounded-[6px] px-1.5 py-1 brand-soft-hover"
              href={`/sector/${tile.market}/${tile.slug}`}
            >
              <span className="truncate text-[13px] font-semibold text-[var(--text-main)]">{tile.name}</span>
              <span className={`font-mono text-[13px] font-bold ${changeColorClass(tile.returns[period])}`}>
                {formatChangeRate(tile.returns[period])}
              </span>
            </Link>
          </li>
        ))}
        {tiles.length === 0 ? (
          <li className="text-xs text-[var(--text-softest)]">표시할 섹터가 없습니다</li>
        ) : null}
      </ol>
    </div>
  );
}

export function SectorHeatmapBoard({ initialHeatmap }: { initialHeatmap: HeatmapPayload }) {
  const [market, setMarket] = useState<MarketId>(initialHeatmap.market);
  const [period, setPeriod] = useState<HeatmapPeriod>("1d");
  const [payloads, setPayloads] = useState<Partial<Record<MarketId, HeatmapPayload>>>({
    [initialHeatmap.market]: initialHeatmap,
  });
  const [loadingMarket, setLoadingMarket] = useState<MarketId | null>(null);

  const loadMarket = useCallback(
    async (target: MarketId) => {
      if (payloads[target]) {
        return;
      }
      setLoadingMarket(target);
      try {
        const response = await fetch(`/api/v2/heatmap?market=${target}`);
        if (!response.ok) {
          throw new Error(`heatmap ${response.status}`);
        }
        const payload = (await response.json()) as HeatmapPayload;
        setPayloads((current) => ({ ...current, [target]: payload }));
      } catch {
        // 로드 실패 시 탭은 빈 상태 메시지를 유지한다
      } finally {
        setLoadingMarket((current) => (current === target ? null : current));
      }
    },
    [payloads],
  );

  useEffect(() => {
    void loadMarket(market);
  }, [market, loadMarket]);

  const payload = payloads[market];
  const tiles = useMemo(() => (payload ? sortTiles(payload.tiles, period) : []), [payload, period]);
  const ranked = useMemo(() => tiles.filter((tile) => tile.returns[period] !== null), [tiles, period]);
  const strongest = ranked.slice(0, 3);
  const weakest = ranked.slice(-3).reverse().filter((tile) => !strongest.includes(tile));

  return (
    <section aria-label="섹터 히트맵" className="surface-card rounded-[12px] p-4 md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-[var(--text-main)]">섹터 흐름</h2>
          <DemoNotice show={payload?.isDemo ?? false} />
        </div>

        <div className="flex items-center gap-2">
          <div className="surface-pill flex rounded-[6px] p-0.5" role="tablist" aria-label="시장 선택">
            {MARKET_TABS.map((tab) => (
              <button
                key={tab.value}
                aria-selected={market === tab.value}
                className={`rounded-[5px] px-3 py-1 text-xs font-semibold transition-colors ${
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

          <div className="surface-pill flex rounded-[6px] p-0.5" role="tablist" aria-label="기간 선택">
            {HEATMAP_PERIODS.map((option) => (
              <button
                key={option.value}
                aria-selected={period === option.value}
                className={`rounded-[5px] px-2.5 py-1 text-xs font-semibold transition-colors ${
                  period === option.value ? "brand-tab-active" : "text-[var(--text-soft)] brand-soft-hover"
                }`}
                onClick={() => setPeriod(option.value)}
                role="tab"
                type="button"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-1.5 text-xs text-[var(--text-softest)]">
        섹터별 대표 ETF의 {HEATMAP_PERIODS.find((option) => option.value === period)?.label} 수익률입니다. 타일을
        누르면 구성 종목을 볼 수 있습니다.
      </p>

      {payload ? (
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {tiles.map((tile) => (
            <HeatmapTile key={tile.slug} period={period} tile={tile} />
          ))}
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 12 }, (_, index) => (
            <div
              key={index}
              className="loading-skeleton min-h-[5.5rem] rounded-[8px] bg-[var(--surface-card-strong)]"
            />
          ))}
        </div>
      )}

      {payload && loadingMarket === null && ranked.length === 0 ? (
        <p className="mt-3 text-sm text-[var(--text-soft)]">시세를 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.</p>
      ) : null}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <HighlightList period={period} tiles={strongest} title="가장 강한 섹터" />
        <HighlightList period={period} tiles={weakest} title="가장 약한 섹터" />
      </div>
    </section>
  );
}
