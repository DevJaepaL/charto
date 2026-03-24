"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { BrandLogo } from "@/components/brand-logo";
import { HomeFavoritesStrip } from "@/components/home-favorites-strip";
import { StockSearch } from "@/components/stock-search";
import type { StockLookupItem } from "@/lib/types";

interface HomePageClientProps {
  featured: StockLookupItem[];
  userKey: string | null;
  userName: string;
  isSignedIn: boolean;
}

export function HomePageClient({
  featured,
  userKey,
  userName,
  isSignedIn,
}: HomePageClientProps) {
  const pathname = usePathname();
  const hasMountedRef = useRef(false);
  const [entryKey, setEntryKey] = useState(0);

  useEffect(() => {
    if (pathname !== "/") {
      return;
    }

    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    setEntryKey((current) => current + 1);
  }, [pathname]);

  return (
    <main className="home-shell page-mobile-shell relative mx-auto min-h-[calc(100vh-160px)] overflow-hidden px-4 pb-12 pt-4 md:px-4 md:pb-14 md:pt-5">
      <section key={entryKey} className="relative flex min-h-full flex-col gap-6">
        <div className="home-reveal flex items-center justify-between gap-3 [--reveal-delay:40ms]">
          <BrandLogo size="md" withBadge={false} />
          <Link className="home-login-chip" href="/login">
            {isSignedIn ? `${userName}으로 로그인되어 있어요` : "로그인하기"}
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
