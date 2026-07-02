import type { Metadata } from "next";
import Link from "next/link";

import { getAllStocks, getFeaturedStocks } from "@/lib/stock-master";
import type { MarketName, StockLookupItem } from "@/lib/types";

const MARKET_ORDER: MarketName[] = ["KOSPI", "KOSDAQ", "KONEX"];

function groupByMarket(items: StockLookupItem[]) {
  return MARKET_ORDER.map((market) => ({
    market,
    items: items.filter((item) => item.market === market),
  })).filter((section) => section.items.length > 0);
}

export const metadata: Metadata = {
  title: "전체 종목",
  description: "Charto에서 분석할 수 있는 국내 주식 종목 전체 목록",
  alternates: {
    canonical: "/stocks",
  },
  robots: {
    index: false,
    follow: true,
  },
  openGraph: {
    url: "/stocks",
    title: "전체 종목 | Charto",
    description: "Charto에서 분석할 수 있는 국내 주식 종목 전체 목록",
  },
  twitter: {
    title: "전체 종목 | Charto",
    description: "Charto에서 분석할 수 있는 국내 주식 종목 전체 목록",
  },
};

export default function StocksPage() {
  const allStocks = getAllStocks();
  const featuredStocks = getFeaturedStocks();
  const sections = groupByMarket(allStocks);

  return (
    <main className="mx-auto max-w-6xl px-5 pb-16 pt-8 md:px-8 md:pb-24 md:pt-12">
      <div className="glass-card rounded-[12px] p-5 md:p-8">
        <Link
          className="text-sm font-semibold text-[var(--brand-strong)] transition-opacity hover:opacity-80"
          href="/"
        >
          ← 홈으로 돌아가기
        </Link>

        <div className="mt-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-slate-50 md:text-[2rem]">
              전체 종목
            </h1>
            <p className="mt-3 max-w-2xl break-keep text-sm leading-6 text-slate-600 dark:text-slate-300">
              Charto에서 바로 분석할 수 있는 국내 주식 종목 목록입니다. 종목명이나 코드를 눌러
              상세 분석 페이지로 이동할 수 있습니다.
            </p>
          </div>
          <div className="rounded-[12px] border border-slate-200/80 bg-white/80 px-4 py-3 text-sm text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
            총 <span className="font-bold text-slate-950 dark:text-slate-50">{allStocks.length.toLocaleString("ko-KR")}</span>개 종목
          </div>
        </div>

        <section className="mt-8">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            대표 종목
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {featuredStocks.map((item) => (
              <Link
                key={item.symbol}
                className="inline-flex items-center rounded-full border border-slate-200/80 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-100 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:bg-white/[0.07]"
                href={`/analyze/${item.symbol}`}
              >
                {item.name}
                <span className="ml-1 text-[10px] text-slate-400 dark:text-slate-500">
                  {item.symbol}
                </span>
              </Link>
            ))}
          </div>
        </section>

        <div className="mt-10 grid gap-6">
          {sections.map((section) => (
            <section key={section.market}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-slate-950 dark:text-slate-50">
                  {section.market}
                </h2>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {section.items.length.toLocaleString("ko-KR")}개
                </div>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {section.items.map((item) => (
                  <Link
                    key={item.symbol}
                    className="rounded-[12px] border border-slate-200/80 bg-white/88 px-4 py-3 transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.07]"
                    href={`/analyze/${item.symbol}`}
                  >
                    <div className="text-sm font-semibold text-slate-950 dark:text-slate-50">
                      {item.name}
                    </div>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {item.symbol} · {item.market}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
