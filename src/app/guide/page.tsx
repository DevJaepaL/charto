import type { Metadata } from "next";
import Link from "next/link";

import { SitePageShell } from "@/components/site-page-shell";
import { loadQuietAccumulation } from "@/lib/market/accumulation";
import { loadMarketRanking } from "@/lib/market/rankings";
import { formatCompactNumber, formatKoreanWon, formatPercent, formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "가이드",
  description: "Charto 사용법, 방법론, 지표 해설, 시장 흐름 요약을 한 페이지에서 확인하는 가이드",
  alternates: {
    canonical: "/guide",
  },
  openGraph: {
    url: "/guide",
    title: "가이드 | Charto",
    description: "Charto 사용법, 방법론, 지표 해설, 시장 흐름 요약을 한 페이지에서 확인하는 가이드",
  },
  twitter: {
    title: "가이드 | Charto",
    description: "Charto 사용법, 방법론, 지표 해설, 시장 흐름 요약을 한 페이지에서 확인하는 가이드",
  },
};

function formatOverviewTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default async function GuidePage() {
  const [valueRanking, volumeRanking, accumulation] = await Promise.all([
    loadMarketRanking("value"),
    loadMarketRanking("volume"),
    loadQuietAccumulation(6),
  ]);

  return (
    <SitePageShell
      title="가이드"
      description="차트 해석 기준과 지표 설명, 당일 시장 흐름 요약"
    >
      <nav className="rounded-[8px] border border-slate-200/80 px-4 py-4 dark:border-white/10">
        <div className="text-sm font-black text-slate-950 dark:text-slate-50">바로 보기</div>
        <div className="mt-3 flex flex-wrap gap-2">
          <a className="rounded-[8px] border border-slate-200/80 px-3 py-2 text-sm font-semibold text-[var(--brand-strong)] dark:border-white/10" href="#overview">
            서비스 개요
          </a>
          <a className="rounded-[8px] border border-slate-200/80 px-3 py-2 text-sm font-semibold text-[var(--brand-strong)] dark:border-white/10" href="#methodology">
            방법론
          </a>
          <a className="rounded-[8px] border border-slate-200/80 px-3 py-2 text-sm font-semibold text-[var(--brand-strong)] dark:border-white/10" href="#indicators">
            지표 해설
          </a>
          <a className="rounded-[8px] border border-slate-200/80 px-3 py-2 text-sm font-semibold text-[var(--brand-strong)] dark:border-white/10" href="#market">
            오늘 시장 흐름
          </a>
        </div>
      </nav>

      <section id="overview">
        <h2 className="text-base font-bold text-slate-950 dark:text-slate-50">서비스 개요</h2>
        <p className="mt-3 break-keep">
          가격·거래량·기술지표·외인·기관 수급을 한 화면에 모은 국내 증시 분석 도구.
        </p>
      </section>

      <section id="methodology">
        <h2 className="text-base font-bold text-slate-950 dark:text-slate-50">방법론</h2>
        <p className="mt-3 break-keep">
          단일 지표에 의존하지 않고 가격 위치·추세·거래량·수급·업종 맥락을 함께 반영합니다.
        </p>
        <p className="mt-3 break-keep">
          추천 점수는 가격·RSI·MACD·거래량·지지/저항을 합산한 요약치입니다. 최종 판단은 각 항목의 근거와 위험을 함께 확인하는 것을 권장합니다.
        </p>
      </section>

      <section id="indicators">
        <h2 className="text-base font-bold text-slate-950 dark:text-slate-50">지표 해설</h2>
        <p className="mt-3 break-keep">
          5·20일선은 추세, RSI·MACD는 모멘텀, 볼린저 밴드는 가격 변동성 구간을 보여줍니다.
        </p>
        <p className="mt-3 break-keep">
          단일 지표보다 거래량·수급을 함께 참고하는 방식을 권장합니다.
        </p>
      </section>

      <section id="market">
        <h2 className="text-base font-bold text-slate-950 dark:text-slate-50">오늘 시장 흐름</h2>
        <p className="mt-3 break-keep">
          업데이트: {formatOverviewTime(accumulation.asOf)}
        </p>
        <p className="mt-3 break-keep">
          거래대금·거래량·수급 상위 종목 요약.
        </p>

        <div className="mt-5 grid gap-6">
          <article>
            <h3 className="text-sm font-black text-slate-950 dark:text-slate-50">거래대금 상위</h3>
            <ul className="mt-3 space-y-3">
              {valueRanking.items.slice(0, 5).map((item) => (
                <li key={`value-${item.stock.symbol}`} className="break-keep">
                  <Link className="font-semibold text-[var(--brand-strong)] hover:underline" href={`/analyze/${item.stock.symbol}`}>
                    {item.stock.name}
                  </Link>{" "}
                  ({item.stock.symbol}) {formatPrice(item.price)} · {formatPercent(item.changePercent)} · 거래대금 {formatCompactNumber(item.tradeValue)}원
                </li>
              ))}
            </ul>
          </article>

          <article>
            <h3 className="text-sm font-black text-slate-950 dark:text-slate-50">거래량 상위</h3>
            <ul className="mt-3 space-y-3">
              {volumeRanking.items.slice(0, 5).map((item) => (
                <li key={`volume-${item.stock.symbol}`} className="break-keep">
                  <Link className="font-semibold text-[var(--brand-strong)] hover:underline" href={`/analyze/${item.stock.symbol}`}>
                    {item.stock.name}
                  </Link>{" "}
                  ({item.stock.symbol}) {formatPrice(item.price)} · {formatPercent(item.changePercent)} · 거래량 {formatCompactNumber(item.volume)}주
                </li>
              ))}
            </ul>
          </article>

          <article>
            <h3 className="text-sm font-black text-slate-950 dark:text-slate-50">외인·기관 순매수</h3>
            <p className="mt-3 break-keep">{accumulation.notice}</p>
            <ul className="mt-3 space-y-3">
              {accumulation.items.length ? (
                accumulation.items.map((item) => (
                <li key={`acc-${item.stock.symbol}`} className="break-keep">
                  <Link className="font-semibold text-[var(--brand-strong)] hover:underline" href={`/analyze/${item.stock.symbol}`}>
                    {item.stock.name}
                  </Link>{" "}
                  ({item.stock.symbol}) 외인 {formatKoreanWon(item.foreignNetBuyAmount5d)} · 기관 {formatKoreanWon(item.institutionNetBuyAmount5d)} · {formatPercent(item.priceChangePercent5d)}
                </li>
              ))
              ) : (
                <li>현재 기준으로 별도 수급 포착 종목이 없습니다.</li>
              )}
            </ul>
          </article>
        </div>
      </section>
    </SitePageShell>
  );
}
