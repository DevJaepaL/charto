import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { formatChangeRate, formatMarketCap, formatPrice, HEATMAP_PERIODS } from "@/lib/market-v2/compute";
import { findSector, getSectorsByMarket, isMarketId, type MarketId } from "@/lib/market-v2/sectors";
import { getSectorDetail } from "@/lib/market-v2/service";
import { AdSlot } from "@/components/ad-slot";
import { DemoNotice } from "@/components/v2/demo-notice";
import { changeColorClass } from "@/components/v2/price-format";

export const dynamic = "force-dynamic";

interface SectorPageParams {
  market: string;
  slug: string;
}

function resolveMarket(raw: string): MarketId | null {
  const upper = raw.toUpperCase();
  return isMarketId(upper) ? upper : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<SectorPageParams>;
}): Promise<Metadata> {
  const { market: rawMarket, slug } = await params;
  const market = resolveMarket(rawMarket);
  const sector = market ? findSector(market, slug) : null;

  if (!sector) {
    return { title: "섹터를 찾을 수 없습니다" };
  }

  const marketLabel = market === "KR" ? "국내" : "미국";

  return {
    title: `${marketLabel} ${sector.name} 섹터`,
    description: `${sector.name} 섹터의 대표 ETF(${sector.etf.name}) 수익률과 주요 구성 종목의 시가총액·등락률`,
    alternates: { canonical: `/sector/${market}/${sector.slug}` },
  };
}

const ANALYST_LINKS = [
  { key: "tipranks", label: "TipRanks", url: (symbol: string) => `https://www.tipranks.com/stocks/${symbol}/forecast` },
  { key: "seekingalpha", label: "Seeking Alpha", url: (symbol: string) => `https://seekingalpha.com/symbol/${symbol}` },
] as const;

export default async function SectorPage({ params }: { params: Promise<SectorPageParams> }) {
  const { market: rawMarket, slug } = await params;
  const market = resolveMarket(rawMarket);

  if (!market) {
    notFound();
  }

  const detail = await getSectorDetail(market, slug);

  if (!detail) {
    notFound();
  }

  const marketLabel = market === "KR" ? "국내" : "미국";
  const otherSectors = getSectorsByMarket(market).filter((sector) => sector.slug !== slug);
  const maxMarketCap = Math.max(...detail.constituents.map((row) => row.marketCap ?? 0), 1);

  return (
    <main className="mx-auto max-w-5xl px-4 pb-14 pt-6 md:px-6 md:pt-8">
      <Link
        className="text-sm font-semibold text-[var(--brand-strong)] transition-opacity hover:opacity-80"
        href="/"
      >
        ← 마켓 대시보드
      </Link>

      <header className="mt-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="brand-badge rounded-[4px] px-2 py-0.5 text-[11px] font-bold">{marketLabel}</span>
          <h1 className="text-xl font-bold tracking-tight text-[var(--text-main)] md:text-2xl">
            {detail.name} 섹터
          </h1>
          <DemoNotice show={detail.isDemo} />
        </div>
        <p className="mt-1.5 text-sm text-[var(--text-soft)]">
          대표 ETF <span className="font-semibold text-[var(--text-main)]">{detail.etf.name}</span>
          <span className="ml-1 text-xs text-[var(--text-softest)]">({detail.etf.symbol})</span> 기준으로 섹터
          흐름을 보여드려요.
        </p>
      </header>

      <section aria-label="대표 ETF 수익률" className="surface-card mt-5 rounded-[12px] p-4 md:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold text-[var(--text-softest)]">ETF 현재가</p>
            <p className="mt-1 font-mono text-2xl font-bold tracking-tight text-[var(--text-main)]">
              {formatPrice(detail.etf.lastPrice, detail.etf.currency)}
            </p>
          </div>
          <div className="flex gap-2">
            {HEATMAP_PERIODS.map((option) => {
              const rate = detail.etf.returns[option.value];
              return (
                <div key={option.value} className="surface-card-strong min-w-[4.5rem] rounded-[8px] px-3 py-2 text-center">
                  <p className="text-[10px] font-semibold text-[var(--text-softest)]">{option.label}</p>
                  <p className={`mt-0.5 font-mono text-[13px] font-bold ${changeColorClass(rate)}`}>
                    {formatChangeRate(rate)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section aria-label="주요 구성 종목" className="surface-card mt-4 rounded-[12px] p-4 md:p-5">
        <h2 className="text-base font-bold text-[var(--text-main)]">주요 구성 종목</h2>
        <p className="mt-1.5 text-xs text-[var(--text-softest)]">
          {detail.etf.name}의 주요 편입 종목을 시가총액 순으로 정렬했습니다. 시가총액은 현재가 × 발행주식수로
          계산한 참고치입니다.
        </p>

        <ol className="mt-3 divide-y divide-[var(--line-soft)]">
          {detail.constituents.map((row, index) => {
            const capRatio = row.marketCap !== null ? Math.max(row.marketCap / maxMarketCap, 0.02) : 0;

            return (
              <li key={row.symbol} className="px-1 py-3">
                <div className="flex items-center gap-3">
                  <span className="w-5 shrink-0 text-center font-mono text-xs font-bold text-[var(--text-softest)]">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-1.5">
                      <p className="truncate text-[13px] font-semibold text-[var(--text-main)]">{row.name}</p>
                      <span className="shrink-0 text-[11px] text-[var(--text-softest)]">{row.symbol}</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="flex h-1.5 w-full max-w-[16rem] overflow-hidden rounded-full bg-[var(--surface-pill)]">
                        <div
                          className="rounded-full"
                          style={{
                            width: `${Math.round(capRatio * 100)}%`,
                            background: "var(--brand)",
                            opacity: 0.55,
                          }}
                        />
                      </div>
                      <span className="shrink-0 font-mono text-[11px] font-semibold text-[var(--text-soft)]">
                        {formatMarketCap(row.marketCap, row.currency)}
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-mono text-[13px] font-bold text-[var(--text-main)]">
                      {formatPrice(row.lastPrice, row.currency)}
                    </p>
                    <p className={`font-mono text-xs font-semibold ${changeColorClass(row.changeRate)}`}>
                      {formatChangeRate(row.changeRate)}
                    </p>
                  </div>
                </div>

                {market === "US" ? (
                  <div className="mt-1.5 flex items-center gap-2 pl-8">
                    <span className="text-[10px] font-semibold text-[var(--text-softest)]">애널리스트 의견</span>
                    {ANALYST_LINKS.map((link) => (
                      <a
                        key={link.key}
                        className="rounded-[4px] border border-[var(--line-soft)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--text-soft)] brand-outline-hover"
                        href={link.url(row.symbol)}
                        rel="noopener noreferrer nofollow"
                        target="_blank"
                      >
                        {link.label} ↗
                      </a>
                    ))}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>
      </section>

      <AdSlot className="mt-4" slot={process.env.NEXT_PUBLIC_ADSENSE_ANALYZE_SLOT} />

      <section aria-label="다른 섹터" className="mt-6">
        <h2 className="text-sm font-bold text-[var(--text-soft)]">{marketLabel} 다른 섹터 보기</h2>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {otherSectors.map((sector) => (
            <Link
              key={sector.slug}
              className="rounded-full border border-[var(--line-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--text-soft)] brand-outline-hover"
              href={`/sector/${sector.market}/${sector.slug}`}
            >
              {sector.shortName}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
