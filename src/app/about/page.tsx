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
      description="CHARTO는 국내·미국 증시의 섹터 흐름을 한 화면에서 보는 마켓 대시보드입니다. 개별 종목을 파기 전에, 지금 시장의 돈이 어느 섹터로 움직이는지 먼저 확인할 수 있게 만들었습니다."
    >
      <section>
        <h2 className="text-base font-bold text-slate-950 dark:text-slate-50">무엇을 제공하나요?</h2>
        <ul className="mt-3 space-y-2">
          <li>국내·미국 섹터 히트맵 — 가장 강한 섹터와 가장 약한 섹터를 기간별(1일~3개월)로 비교</li>
          <li>섹터별 대표 ETF의 수익률과 주요 구성 종목의 시가총액·등락률</li>
          <li>급상승·급하락·거래대금 상위 종목 랭킹 (국내·미국)</li>
          <li>코스피·코스닥 투자자별 순매수(개인·외국인·기관) 동향</li>
          <li>환율, 국채 금리, 장 운영 상태 요약</li>
        </ul>
      </section>
      <section>
        <h2 className="text-base font-bold text-slate-950 dark:text-slate-50">왜 섹터인가요?</h2>
        <p className="mt-3 break-keep">
          개별 종목의 등락은 시장 전체 흐름과 섹터 순환의 영향을 크게 받습니다. 어느 섹터로 자금이 몰리고
          어느 섹터에서 빠져나가는지를 먼저 보면, 종목 단위 뉴스에 휘둘리지 않고 시장의 큰 그림을 읽을 수
          있습니다. CHARTO는 각 섹터를 대표 ETF로 요약해 이 흐름을 히트맵 한 장으로 보여줍니다.
        </p>
      </section>
      <section>
        <h2 className="text-base font-bold text-slate-950 dark:text-slate-50">데이터와 업데이트</h2>
        <p className="mt-3 break-keep">
          시세·랭킹·투자자 동향 데이터는 토스증권 Open API를 기반으로 가져오며, 수 분 단위로 갱신됩니다.
          섹터 분류와 대표 ETF, 주요 구성 종목 목록은 자체 큐레이션으로, ETF의 실제 편입 비중과 다를 수
          있습니다. 시가총액은 현재가와 발행주식수로 계산한 참고치입니다.
        </p>
      </section>
      <section>
        <h2 className="text-base font-bold text-slate-950 dark:text-slate-50">주의 사항</h2>
        <p className="mt-3 break-keep">
          이 서비스는 투자 참고용 정보를 제공하며, 매수·매도 권유를 하지 않습니다. 실제 투자 판단과 책임은
          사용자에게 있습니다.
        </p>
      </section>
    </SitePageShell>
  );
}
