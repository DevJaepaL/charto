import type { Metadata } from "next";

import { SitePageShell } from "@/components/site-page-shell";

export const metadata: Metadata = {
  title: "서비스 소개",
  description: "Charto 서비스 소개와 제공 범위를 안내합니다.",
  alternates: {
    canonical: "/about",
  },
};

export default function AboutPage() {
  return (
    <SitePageShell
      title="서비스 소개"
      description="국내 주식 차트·기술지표·수급·업종 맥락을 한 화면에서 확인하는 분석 서비스."
    >
      <section>
        <h2 className="text-base font-bold text-slate-950 dark:text-slate-50">제공 기능</h2>
        <ul className="mt-3 space-y-2">
          <li>종목 검색 및 차트</li>
          <li>5·20일선, RSI, MACD, 볼린저 밴드 기반 요약</li>
          <li>거래대금·거래량·시가총액 상위 종목</li>
          <li>로그인 사용자 대상 AI 브리핑</li>
        </ul>
      </section>
      <section>
        <h2 className="text-base font-bold text-slate-950 dark:text-slate-50">배경</h2>
        <p className="mt-3 break-keep">
          가격 외에 이동평균선·RSI·MACD·거래량·수급을 함께 보면 판단의 정확도가 높아집니다. 당일 흐름과 중기 추세를 한 화면에서 비교할 수 있게 구성했습니다.
        </p>
      </section>
      <section>
        <h2 className="text-base font-bold text-slate-950 dark:text-slate-50">해석 기준</h2>
        <p className="mt-3 break-keep">
          추천 점수는 이동평균선 위치, RSI 구간, MACD 방향, 볼린저 밴드 위치, 거래량, 지지/저항을 반영합니다. 지표 간 충돌이 있을 때는 점수로 평균 내지 않고 각 항목의 근거를 함께 노출합니다.
        </p>
      </section>
      <section>
        <h2 className="text-base font-bold text-slate-950 dark:text-slate-50">데이터</h2>
        <p className="mt-3 break-keep">
          시세·순위 데이터는 한국투자 Open API 기반입니다. 장중 수급은 추정치로 수 분 단위 차이가 있을 수 있으며, 공시 요약은 제출 시점에 따라 반영 간격이 달라질 수 있습니다.
        </p>
      </section>
      <section>
        <h2 className="text-base font-bold text-slate-950 dark:text-slate-50">주의</h2>
        <p className="mt-3 break-keep">
          투자 참고용 정보이며 매수·매도를 권유하지 않습니다. 투자 판단과 책임은 사용자에게 있습니다.
        </p>
      </section>
    </SitePageShell>
  );
}
