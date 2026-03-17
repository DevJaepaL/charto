import Link from "next/link";

import { AdSlot } from "@/components/ad-slot";
import { BrandLogo } from "@/components/brand-logo";
import { FavoriteStocksPanel } from "@/components/favorite-stocks-panel";
import { MarketPulsePanel } from "@/components/market-pulse-panel";
import { StockSearch } from "@/components/stock-search";
import { getServerAuthSession } from "@/lib/auth";
import { getFeaturedStocks } from "@/lib/stock-master";

export default async function Home() {
  const featured = getFeaturedStocks();
  const homeAdSlot = process.env.NEXT_PUBLIC_ADSENSE_HOME_SLOT?.trim() ?? "";
  const session = await getServerAuthSession();
  const userName = session?.user?.name?.trim() || "로그인 사용자";
  const favoriteUserKey = session?.user?.email?.trim() || session?.user?.name?.trim() || null;

  return (
    <main className="mx-auto max-w-6xl px-4 pb-8 pt-5 md:px-6 md:pb-12 md:pt-8">
      <section className="home-stage relative overflow-hidden rounded-[22px] p-4 md:rounded-[26px] md:p-6">
        <div className="relative mx-auto w-full max-w-[920px]">
          <div className="home-reveal mb-3 flex items-center justify-between gap-3 [--reveal-delay:40ms]">
            <BrandLogo size="md" withBadge={false} />
            <Link
              className="inline-flex items-center rounded-full border border-[rgba(var(--brand-rgb),0.24)] bg-[var(--surface-card)] px-4 py-2 text-[13px] font-bold text-[var(--brand-strong)] shadow-[0_8px_20px_rgba(15,23,42,0.05)] transition hover:border-[rgba(var(--brand-rgb),0.34)] hover:bg-[var(--interactive-hover)] md:px-4.5 md:py-2.5 md:text-sm"
              href="/login"
            >
              {session?.user ? `${userName}으로 로그인되어 있어요` : "로그인 하기"}
            </Link>
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
          <FavoriteStocksPanel userKey={favoriteUserKey} userName={session?.user?.name ?? null} />
          <div className="home-reveal mt-4 w-full [--reveal-delay:420ms]">
            <MarketPulsePanel />
          </div>
          <AdSlot className="home-reveal mt-4 [--reveal-delay:500ms]" label="광고" slot={homeAdSlot} />
        </div>
      </section>
    </main>
  );
}
