import type { Metadata } from "next";

import { SitePageShell } from "@/components/site-page-shell";

export const metadata: Metadata = {
  title: "방법론",
  description: "Charto가 국내 주식 차트와 기술지표, 수급 데이터를 해석하는 기준",
  alternates: {
    canonical: "/methodology",
  },
  openGraph: {
    url: "/methodology",
    title: "방법론 | Charto",
    description: "Charto가 국내 주식 차트와 기술지표, 수급 데이터를 해석하는 기준",
  },
  twitter: {
    title: "방법론 | Charto",
    description: "Charto가 국내 주식 차트와 기술지표, 수급 데이터를 해석하는 기준",
  },
};

export default function MethodologyPage() {
  return (
    <SitePageShell
      title="방법론"
      description="Charto가 차트, 기술지표, 거래량, 외인·기관 수급을 어떤 기준으로 정리하는지 공개합니다."
    >
      <section>
        <h2 className="text-base font-bold text-slate-950 dark:text-slate-50">기본 원칙</h2>
        <p className="mt-3 break-keep">
          Charto는 한 개의 지표만으로 종목을 좋다, 나쁘다로 단정하지 않습니다. 가격 위치와 추세, 모멘텀,
          변동성, 거래량, 수급, 업종 맥락을 같이 보며, 서로 충돌하는 신호는 충돌하는 그대로 보여주는 편을
          택합니다. 그래서 추천 점수는 요약일 뿐이고, 최종 해석은 항상 이유와 위험 문장을 함께 읽도록
          구성합니다.
        </p>
      </section>
      <section>
        <h2 className="text-base font-bold text-slate-950 dark:text-slate-50">차트와 기술지표</h2>
        <p className="mt-3 break-keep">
          이동평균선은 현재 가격이 단기와 중기 추세 위에 있는지 확인하는 데 사용합니다. RSI는 과열과 과매도
          구간을 빠르게 확인하고, MACD는 방향 전환과 추세 지속 여부를 보완합니다. 볼린저 밴드는 가격이 평균
          대비 얼마나 확장됐는지 확인하는 데 쓰며, 거래량은 그 움직임에 실제 참여가 붙었는지 판단하는 기준으로
          씁니다.
        </p>
      </section>
      <section>
        <h2 className="text-base font-bold text-slate-950 dark:text-slate-50">추천 점수</h2>
        <p className="mt-3 break-keep">
          추천 점수는 0점에서 100점 사이의 내부 신호 점수로, 단기 가격 위치와 추세, RSI, MACD, 거래량 상태,
          지지선과 저항선 접근 여부를 종합해 계산합니다. 점수가 높을수록 단기 기술 신호가 우호적이라는 뜻이지만,
          점수만 높고 수급이나 업종 사이클이 받쳐주지 않으면 실제 추세는 약할 수 있습니다.
        </p>
      </section>
      <section>
        <h2 className="text-base font-bold text-slate-950 dark:text-slate-50">외인·기관 수급</h2>
        <p className="mt-3 break-keep">
          외인·기관 패널은 최근 연속 순매수 여부와 장중 누적 수급 포착 결과를 함께 반영합니다. 장 마감 이후에는
          최근 며칠의 누적 흐름과 연속성을 우선해서 보여주고, 장중에는 시간 제한 때문에 일부 상세 API가 닫혀도
          상위 수급 데이터와 실시간 순위를 이용해 비어 보이지 않도록 보완합니다.
        </p>
      </section>
      <section>
        <h2 className="text-base font-bold text-slate-950 dark:text-slate-50">기업 맥락과 공시</h2>
        <p className="mt-3 break-keep">
          같은 기술 신호라도 반도체, 방산, 바이오처럼 업종 특성이 다르면 해석이 달라집니다. Charto는 종목명과
          업종 분류를 바탕으로 기본 기업 맥락을 붙이고, 확보 가능한 경우 최근 실적과 IR 관련 공시도 같이 요약해
          차트 해석이 숫자만으로 끝나지 않도록 돕습니다.
        </p>
      </section>
      <section>
        <h2 className="text-base font-bold text-slate-950 dark:text-slate-50">AI 브리핑의 역할</h2>
        <p className="mt-3 break-keep">
          AI 브리핑은 사람이 종목 메모를 정리하듯, 기술지표와 기업 맥락을 문장으로 압축해 읽기 쉽게 만드는
          보조 기능입니다. 사실 확인과 최종 투자 판단을 대신하지 않으며, 자동 요약 특성상 과도한 확신보다
          참고 메모로 활용하는 편이 맞습니다.
        </p>
      </section>
    </SitePageShell>
  );
}
