import { BrandLogo } from "@/components/brand-logo";
import { MarketPulsePanel } from "@/components/market-pulse-panel";
import { StockSearch } from "@/components/stock-search";
import { getFeaturedStocks } from "@/lib/stock-master";

export default function Home() {
  const featured = getFeaturedStocks();

  return (
    <main className="mx-auto max-w-6xl px-4 pb-8 pt-5 md:px-6 md:pb-12 md:pt-8">
      <section className="home-stage relative overflow-hidden rounded-[22px] p-4 md:rounded-[26px] md:p-6">
        <div className="relative mx-auto w-full max-w-[920px]">
          <div className="home-reveal mb-3 [--reveal-delay:40ms]">
            <BrandLogo size="md" withBadge={false} />
          </div>
          <div className="home-reveal text-[11px] font-semibold tracking-[0.08em] text-[var(--brand-strong)] [--reveal-delay:120ms] md:text-[12px]">
            KOSPI · KOSDAQ 분석
          </div>
          <h1 className="home-reveal mt-2.5 max-w-xl text-[1.55rem] font-extrabold leading-tight tracking-tight text-slate-950 [--reveal-delay:180ms] md:text-[2rem]">
            국내 주식,
            <br />
            바로 확인하세요
          </h1>
          <p className="home-reveal mt-2.5 max-w-md text-[13px] leading-5.5 text-slate-600 [--reveal-delay:260ms] md:text-[14px] md:leading-6">
            종목명이나 코드만 입력하면 차트와 핵심 신호를 한 화면에서 볼 수 있어요.
          </p>
          <div className="home-reveal mt-4 w-full [--reveal-delay:340ms]">
            <StockSearch featured={featured} variant="compact" />
          </div>
          <div className="home-reveal mt-4 w-full [--reveal-delay:420ms]">
            <MarketPulsePanel />
          </div>
        </div>
      </section>
    </main>
  );
}
