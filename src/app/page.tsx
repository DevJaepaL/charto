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
    <main className="home-shell page-mobile-shell relative mx-auto min-h-[calc(100vh-160px)] overflow-hidden px-4 pb-12 pt-4 md:px-4 md:pb-14 md:pt-5">
      <div className="pointer-events-none absolute left-[-12%] top-10 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(93,148,255,0.12)_0%,rgba(93,148,255,0)_72%)] blur-3xl dark:bg-[radial-gradient(circle,rgba(93,148,255,0.16)_0%,rgba(93,148,255,0)_72%)]" />
      <div className="pointer-events-none absolute right-[-18%] top-28 h-60 w-60 rounded-full bg-[radial-gradient(circle,rgba(112,211,255,0.08)_0%,rgba(112,211,255,0)_72%)] blur-3xl dark:bg-[radial-gradient(circle,rgba(112,211,255,0.1)_0%,rgba(112,211,255,0)_72%)]" />
      <section className="relative flex min-h-full flex-col gap-6">
        <div className="home-reveal flex items-center justify-between gap-3 [--reveal-delay:40ms]">
          <BrandLogo size="md" withBadge={false} />
          <Link className="home-login-chip" href="/login">
            {session?.user ? `${userName}으로 로그인되어 있어요` : "로그인 하기"}
          </Link>
        </div>

        <div className="flex flex-1 flex-col justify-center gap-6 pb-4 pt-8">
          <div className="home-reveal max-w-[18rem] [--reveal-delay:120ms]">
            <h1 className="font-korean-display text-[1.375rem] font-bold leading-[1.6] text-slate-950 dark:text-slate-50">
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
