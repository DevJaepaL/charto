import Link from "next/link";

import { BrandLogo } from "@/components/brand-logo";
import { HomeFavoritesStrip } from "@/components/home-favorites-strip";
import { StockSearch } from "@/components/stock-search";
import { getServerAuthSession } from "@/lib/auth";
import { getFeaturedStocks } from "@/lib/stock-master";

export default async function Home() {
  const featured = getFeaturedStocks();
  const session = await getServerAuthSession();
  const userName = session?.user?.name?.trim() || "로그인 사용자";
  const userKey = session?.user?.id?.trim() || null;

  return (
    <main className="home-shell relative mx-auto max-w-[1240px] overflow-hidden px-4 pb-14 pt-4 md:px-6 md:pb-20 md:pt-6">
      <div className="pointer-events-none absolute left-[-10%] top-12 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(93,148,255,0.14)_0%,rgba(93,148,255,0)_72%)] blur-3xl dark:bg-[radial-gradient(circle,rgba(93,148,255,0.18)_0%,rgba(93,148,255,0)_72%)]" />
      <div className="pointer-events-none absolute right-[-12%] top-32 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(112,211,255,0.12)_0%,rgba(112,211,255,0)_72%)] blur-3xl dark:bg-[radial-gradient(circle,rgba(112,211,255,0.14)_0%,rgba(112,211,255,0)_72%)]" />
      <section className="relative">
        <div className="home-reveal flex items-center justify-between gap-3 [--reveal-delay:40ms]">
          <BrandLogo size="md" withBadge={false} />
          <Link className="home-login-chip" href="/login">
            {session?.user ? `${userName}으로 로그인되어 있어요` : "로그인 하기"}
          </Link>
        </div>

        <div className="mx-auto grid max-w-[1120px] gap-10 pb-10 pt-14 md:min-h-[calc(100vh-12rem)] md:grid-cols-[minmax(0,0.95fr)_minmax(390px,0.85fr)] md:items-center md:gap-14 md:pb-14 md:pt-10">
          <div className="home-reveal max-w-[320px] [--reveal-delay:120ms]">
            <h1 className="font-korean-display max-w-[280px] text-[1.375rem] font-bold leading-[1.62] text-slate-950 dark:text-slate-50 md:max-w-[320px] md:text-[1.375rem]">
              국내 증시 종목을
              <br />
              기술적으로 분석해드려요.
            </h1>
          </div>

          <div className="home-reveal home-search-stage [--reveal-delay:200ms]">
            <StockSearch featured={featured.slice(0, 8)} variant="hero" />
            <HomeFavoritesStrip userKey={userKey} />
          </div>
        </div>
      </section>
    </main>
  );
}
