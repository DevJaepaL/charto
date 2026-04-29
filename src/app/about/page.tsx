import type { Metadata } from "next";

import { SitePageShell } from "@/components/site-page-shell";

export const metadata: Metadata = {
  title: "서비스 소개",
  description: "서비스 소개와 제공 범위를 안내합니다.",
  alternates: {
    canonical: "/about",
  },
};

export default function AboutPage() {
  return (
    <SitePageShell
      title="서비스 소개"
      description="CHARTO는 국내 주식 차트와 기술지표, 수급 흐름, 업종 맥락을 한 번에 확인할 수 있도록 정리하는 국내 증시 분석 서비스입니다."
    >
      <section>
        <h2 className="text-base font-bold text-slate-950 dark:text-slate-50">무엇을 제공하나요?</h2>
        <ul className="mt-3 space-y-2">
          <li>국내 주식 검색과 차트 확인</li>
          <li>5일선, 20일선, RSI, MACD, 볼린저 밴드 기반 요약</li>
          <li>거래대금, 거래량, 시가총액 기준 상위 종목 흐름</li>
          <li>로그인 사용자 대상 AI 브리핑</li>
        </ul>
      </section>
      <section>
        <h2 className="text-base font-bold text-slate-950 dark:text-slate-50">왜 만들었나요?</h2>
        <p className="mt-3 break-keep">
          국내 주식 차트를 볼 때는 가격만 보는 것보다 이동평균선, RSI, MACD, 거래량, 외인·기관 수급을 함께
          보는 편이 훨씬 실전적입니다. CHARTO는 이런 판단 재료를 한 화면에 모아, 당일 흐름과 중기 추세를
          빠르게 비교할 수 있도록 구성했습니다.
        </p>
      </section>
      <section>
        <h2 className="text-base font-bold text-slate-950 dark:text-slate-50">어떤 기준으로 해석하나요?</h2>
        <p className="mt-3 break-keep">
          차트 신호 점수는 이동평균선 위치, RSI 구간, MACD 방향, 볼린저 밴드 위치, 거래량 상태, 지지선과 저항선
          정보를 함께 반영해 계산합니다. 한 지표가 과열 신호를 보여도 다른 지표가 추세 유지를 지지하면 그
          충돌을 그대로 드러내는 방식이라, 단일 숫자보다 이유와 위험을 같이 읽는 데 초점을 둡니다.
        </p>
      </section>
      <section>
        <h2 className="text-base font-bold text-slate-950 dark:text-slate-50">데이터와 업데이트</h2>
        <p className="mt-3 break-keep">
          시세와 순위 데이터는 한국투자 Open API를 기반으로 가져오며, 기업 맥락과 공시 해석은 공개 데이터와
          내부 정리 규칙을 함께 사용합니다. 장중 수급은 추정치가 섞일 수 있어 수 분 단위로 차이가 날 수
          있고, 종목별 공시 요약은 최신 제출 시점에 따라 반영 간격이 달라질 수 있습니다.
        </p>
      </section>
      <section>
        <h2 className="text-base font-bold text-slate-950 dark:text-slate-50">주의 사항</h2>
        <p className="mt-3 break-keep">
          이 서비스는 투자 참고용 정보를 제공하며, 매수·매도 권유를 하지 않습니다. 실제 투자 판단과 책임은 사용자에게 있습니다.
        </p>
      </section>
    </SitePageShell>
  );
}
