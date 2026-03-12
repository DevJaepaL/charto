import type { Metadata } from "next";

import { SitePageShell } from "@/components/site-page-shell";

export const metadata: Metadata = {
  title: "서비스 소개",
  description: "Charto 서비스 소개와 제공 범위를 안내합니다.",
};

export default function AboutPage() {
  return (
    <SitePageShell
      title="서비스 소개"
      description="Charto는 국내 주식 차트와 기술지표를 빠르게 확인하고, 로그인한 사용자에게 AI 브리핑을 제공하는 분석 웹앱입니다."
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
        <h2 className="text-base font-bold text-slate-950 dark:text-slate-50">주의 사항</h2>
        <p className="mt-3 break-keep">
          Charto는 투자 참고용 정보를 제공하며, 매수·매도 권유를 하지 않습니다. 실제 투자 판단과 책임은 사용자에게 있습니다.
        </p>
      </section>
    </SitePageShell>
  );
}
