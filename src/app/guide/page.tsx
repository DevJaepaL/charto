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
      description="Charto를 처음 보는 사용자도 차트 해석 기준과 핵심 지표, 시장 흐름을 한 페이지에서 바로 확인할 수 있도록 정리한 문서입니다."
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
          Charto는 국내 주식의 가격, 거래량, 기술지표, 외인·기관 수급을 한 화면에서 정리하는 분석
          도구입니다. 단순히 차트 모양만 보여주는 대신, 어떤 지표가 현재 흐름을 밀고 있는지와 어떤 위험
          신호가 남아 있는지를 문장으로 풀어 보여주는 데 초점을 맞추고 있습니다.
        </p>
        <p className="mt-3 break-keep">
          이동평균선은 추세 방향을, RSI와 MACD는 모멘텀의 강도와 둔화를, 볼린저 밴드는 가격이 평균 대비
          어느 정도 확장됐는지를 보여줍니다. 여기에 거래량과 외인·기관 흐름을 붙여서, 가격만 오르는
          종목인지 실제 수급이 동반되는 종목인지를 함께 확인할 수 있게 구성했습니다.
        </p>
      </section>

      <section id="methodology">
        <h2 className="text-base font-bold text-slate-950 dark:text-slate-50">방법론</h2>
        <p className="mt-3 break-keep">
          Charto는 한 개의 지표만으로 종목을 좋다, 나쁘다로 단정하지 않습니다. 가격 위치와 추세, 모멘텀,
          변동성, 거래량, 수급, 업종 맥락을 같이 보며, 서로 충돌하는 신호는 충돌하는 그대로 보여주는 편을
          택합니다. 그래서 추천 점수는 요약일 뿐이고, 최종 해석은 항상 이유와 위험 문장을 함께 읽도록
          구성합니다.
        </p>
        <p className="mt-3 break-keep">
          추천 점수는 0점에서 100점 사이의 내부 신호 점수로, 단기 가격 위치와 추세, RSI, MACD, 거래량 상태,
          지지선과 저항선 접근 여부를 종합해 계산합니다. 점수가 높을수록 단기 기술 신호가 우호적이라는 뜻이지만,
          점수만 높고 수급이나 업종 사이클이 받쳐주지 않으면 실제 추세는 약할 수 있습니다.
        </p>
        <p className="mt-3 break-keep">
          외인·기관 패널은 최근 연속 순매수 여부와 장중 누적 수급 포착 결과를 함께 반영합니다. 장 마감 이후에는
          최근 며칠의 누적 흐름과 연속성을 우선해서 보여주고, 장중에는 시간 제한 때문에 일부 상세 API가 닫혀도
          상위 수급 데이터와 실시간 순위를 이용해 비어 보이지 않도록 보완합니다.
        </p>
      </section>

      <section id="indicators">
        <h2 className="text-base font-bold text-slate-950 dark:text-slate-50">지표 해설</h2>
        <p className="mt-3 break-keep">
          5일선은 아주 짧은 흐름, 20일선은 단기 추세의 중심을 보여줍니다. 현재가가 5일선과 20일선 위에 있으면
          단기 매수 우위로 해석하고, 아래에 있으면 아직 회복이 완전히 확인되지 않은 상태로 봅니다.
        </p>
        <p className="mt-3 break-keep">
          RSI는 최근 상승과 하락의 힘을 비교한 모멘텀 지표입니다. 일반적으로 70 부근 이상은 과열, 30 부근
          이하는 과매도로 해석하지만, 강한 추세 구간에서는 과열권에 오래 머무를 수 있습니다. MACD는 추세의
          방향과 탄력 변화를 보는 지표이고, 히스토그램 축소 여부까지 함께 봐야 둔화를 읽을 수 있습니다.
        </p>
        <p className="mt-3 break-keep">
          볼린저 밴드는 평균 대비 가격 변동 폭을 확인하는 지표입니다. 상단권은 강한 추세일 수도 있지만 과열일
          수도 있고, 하단권은 약세 압력일 수도 있지만 반등 후보 자리일 수도 있습니다. 가격 해석은 반드시
          거래량과 수급까지 붙여서 보는 편이 더 실전적입니다.
        </p>
      </section>

      <section id="market">
        <h2 className="text-base font-bold text-slate-950 dark:text-slate-50">오늘 시장 흐름</h2>
        <p className="mt-3 break-keep">
          마지막 업데이트: {formatOverviewTime(accumulation.asOf)}
        </p>
        <p className="mt-3 break-keep">
          이 섹션은 당일 거래대금 상위, 거래량 상위, 외인·기관 수급 포착 종목을 함께 보면서 시장의 중심이
          어디에 형성되는지 확인하기 위한 요약입니다.
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
                  ({item.stock.symbol})은(는) 현재 {formatPrice(item.price)}, 전일 대비 {formatPercent(item.changePercent)} 흐름이며
                  거래대금은 약 {formatCompactNumber(item.tradeValue)}원 수준입니다.
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
                  ({item.stock.symbol})은(는) 현재 {formatPrice(item.price)}, 전일 대비 {formatPercent(item.changePercent)}이며
                  누적 거래량은 약 {formatCompactNumber(item.volume)}주입니다.
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
                    ({item.stock.symbol})은(는) 외인 {formatKoreanWon(item.foreignNetBuyAmount5d)}, 기관 {formatKoreanWon(item.institutionNetBuyAmount5d)}
                    수급이 포착됐고 최근 등락률은 {formatPercent(item.priceChangePercent5d)}입니다.
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
