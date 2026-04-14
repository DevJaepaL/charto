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
            국내 증시 차트를 읽을 때 먼저 보는 기준
          </h2>
          <p className="mt-4 break-keep text-sm leading-7 text-slate-600 dark:text-slate-300 md:text-[15px]">
            Charto는 가격, 거래량, 기술지표, 외인·기관 수급을 한 화면에서 빠르게 확인할 수 있게 정리한
            국내 증시 분석 도구입니다.
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <article className="rounded-[8px] border border-slate-200/80 px-4 py-4 dark:border-white/10">
            <h3 className="text-base font-black text-slate-950 dark:text-slate-50">이 사이트에서 확인할 수 있는 것</h3>
            <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-700 dark:text-slate-200">
              <li>1. 국내 상장 종목의 차트와 핵심 기술지표</li>
              <li>2. 거래대금, 거래량, 시가총액 기준의 시장 상위 흐름</li>
              <li>3. 장중 외인·기관 매수세가 붙는 종목 탐색</li>
              <li>4. 업종 맥락과 최근 공시를 반영한 해석 보조</li>
            </ul>
            <p className="mt-4 break-keep text-sm leading-7 text-slate-600 dark:text-slate-300">
              자세한 기준과 지표 읽는 법, 오늘 시장 흐름은{" "}
              <Link className="font-semibold text-[var(--brand-strong)] hover:underline" href="/guide">
                가이드
              </Link>
              에서 한 번에 정리해두었습니다.
            </p>
          </article>

          <article className="rounded-[8px] border border-slate-200/80 px-4 py-4 dark:border-white/10">
            <h3 className="text-base font-black text-slate-950 dark:text-slate-50">대표 분석 종목</h3>
            <p className="mt-3 break-keep text-sm leading-7 text-slate-600 dark:text-slate-300">
              대표 종목 페이지에서 차트와 핵심 해석을 바로 볼 수 있습니다.
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
