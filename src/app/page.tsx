import { BrandLogo } from "@/components/brand-logo";
import { MarketPulsePanel } from "@/components/market-pulse-panel";
import { StockSearch } from "@/components/stock-search";
import { getFeaturedStocks } from "@/lib/stock-master";

export default function Home() {
  const featured = getFeaturedStocks();

  return (
    <main className="mx-auto max-w-7xl px-5 pb-10 pt-6 md:px-8 md:pb-14 md:pt-8">
      <section className="glass-card relative overflow-hidden rounded-[36px] p-5 md:p-8">
        <div className="relative grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(340px,420px)] xl:items-start">
          <div className="min-w-0 xl:pr-2">
            <div className="mb-3">
              <BrandLogo size="md" withBadge={false} />
            </div>
            <div className="text-xs font-semibold tracking-[0.12em] text-[var(--brand-strong)] md:text-sm">
              KOSPI · KOSDAQ
            </div>
            <h1 className="mt-3 max-w-2xl text-2xl font-extrabold leading-tight tracking-tight text-slate-950 md:text-[2.2rem]">
              보고 싶은 종목을
              <br />
              바로 검색하세요
            </h1>
            <p className="mt-3 max-w-lg text-sm leading-6 text-slate-600 md:text-[15px]">
              종목명이나 코드만 입력하면 바로 분석 화면으로 이동합니다.
            </p>
            <div className="mt-4 w-full">
              <StockSearch featured={featured} variant="compact" />
            </div>
          </div>

          <div className="xl:max-w-[392px] xl:justify-self-end">
            <MarketPulsePanel />
          </div>
        </div>
      </section>
    </main>
  );
}
