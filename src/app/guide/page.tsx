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
      description="Charto의 차트 해석 기준과 핵심 지표, 오늘 시장 흐름을 한 페이지로 정리한 가이드입니다."
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
          Charto는 가격, 거래량, 기술지표, 외인·기관 수급을 한 화면에서 정리하는 국내 증시 분석 도구입니다.
        </p>
      </section>

      <section id="methodology">
        <h2 className="text-base font-bold text-slate-950 dark:text-slate-50">방법론</h2>
        <p className="mt-3 break-keep">
          한 개의 지표만으로 결론을 내리지 않고, 가격 위치와 추세, 거래량, 수급, 업종 맥락을 함께 봅니다.
        </p>
        <p className="mt-3 break-keep">
          추천 점수는 가격, RSI, MACD, 거래량, 지지선과 저항선을 합쳐 계산합니다. 점수는 요약이고, 실제 해석은 이유와 위험을 같이 보는 쪽에 가깝습니다.
        </p>
      </section>

      <section id="indicators">
        <h2 className="text-base font-bold text-slate-950 dark:text-slate-50">지표 해설</h2>
        <p className="mt-3 break-keep">
          5일선과 20일선은 추세 방향을, RSI와 MACD는 모멘텀을, 볼린저 밴드는 가격 확장 구간을 보는 데 씁니다.
        </p>
        <p className="mt-3 break-keep">
          가격 해석은 지표 하나보다 거래량과 수급까지 같이 보는 편이 더 정확합니다.
        </p>
      </section>

      <section id="market">
        <h2 className="text-base font-bold text-slate-950 dark:text-slate-50">오늘 시장 흐름</h2>
        <p className="mt-3 break-keep">
          마지막 업데이트: {formatOverviewTime(accumulation.asOf)}
        </p>
        <p className="mt-3 break-keep">
          당일 거래대금 상위, 거래량 상위, 외인·기관 수급 포착 종목을 함께 보여주는 요약입니다.
        </p>

        <div className="mt-5 grid gap-6">
          <article>
            <h3 className="text-sm font-black text-slate-950 dark:text-slate-50">거래대금이 몰린 종목</h3>
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
            <h3 className="text-sm font-black text-slate-950 dark:text-slate-50">거래량이 크게 붙는 종목</h3>
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
            <h3 className="text-sm font-black text-slate-950 dark:text-slate-50">외인·기관 수급 포착 종목</h3>
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
