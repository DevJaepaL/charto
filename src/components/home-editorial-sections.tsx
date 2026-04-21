import Link from "next/link";

import type { StockLookupItem } from "@/lib/types";

export function HomeEditorialSections({ featured }: { featured: StockLookupItem[] }) {
  return (
    <section className="border-t border-slate-200/70 px-5 py-10 dark:border-white/10 md:px-8 md:py-14">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-3xl">
          <div className="text-[11px] font-black tracking-[0.12em] text-[var(--brand-strong)]">
            Charto 가이드
          </div>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950 dark:text-slate-50 md:text-[2rem]">
            한 화면에서 보는 국내 증시 차트
          </h2>
          <p className="mt-4 break-keep text-sm leading-7 text-slate-600 dark:text-slate-300 md:text-[15px]">
            가격·거래량·기술지표·외인·기관 수급을 모아 보여주는 국내 증시 분석 도구입니다.
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <article className="rounded-[8px] border border-slate-200/80 px-4 py-4 dark:border-white/10">
            <h3 className="text-base font-black text-slate-950 dark:text-slate-50">제공 범위</h3>
            <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-700 dark:text-slate-200">
              <li>국내 상장 종목 차트와 기술지표</li>
              <li>거래대금·거래량·시가총액 상위 종목</li>
              <li>장중 외인·기관 매수 유입 종목</li>
              <li>업종·공시 기반 참고 해석</li>
            </ul>
            <p className="mt-4 break-keep text-sm leading-7 text-slate-600 dark:text-slate-300">
              지표 읽는 법은{" "}
              <Link className="font-semibold text-[var(--brand-strong)] hover:underline" href="/guide">
                가이드
              </Link>
              에서 확인할 수 있습니다.
            </p>
          </article>

          <article className="rounded-[8px] border border-slate-200/80 px-4 py-4 dark:border-white/10">
            <h3 className="text-base font-black text-slate-950 dark:text-slate-50">주요 종목</h3>
            <p className="mt-3 break-keep text-sm leading-7 text-slate-600 dark:text-slate-300">
              종목별 차트와 기술 지표 요약으로 바로 이동합니다.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {featured.map((item) => (
                <Link
                  key={item.symbol}
                  className="inline-flex items-center rounded-[8px] border border-slate-200/80 px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/[0.04]"
                  href={`/analyze/${item.symbol}`}
                >
                  {item.name}
                  <span className="ml-1.5 text-xs text-slate-400 dark:text-slate-500">{item.symbol}</span>
                </Link>
              ))}
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
