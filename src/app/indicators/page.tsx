import type { Metadata } from "next";

import { SitePageShell } from "@/components/site-page-shell";

export const metadata: Metadata = {
  title: "지표 해설",
  description: "이동평균선, RSI, MACD, 볼린저 밴드, 거래량을 Charto에서 읽는 기준",
  alternates: {
    canonical: "/indicators",
  },
  openGraph: {
    url: "/indicators",
    title: "지표 해설 | Charto",
    description: "이동평균선, RSI, MACD, 볼린저 밴드, 거래량을 Charto에서 읽는 기준",
  },
  twitter: {
    title: "지표 해설 | Charto",
    description: "이동평균선, RSI, MACD, 볼린저 밴드, 거래량을 Charto에서 읽는 기준",
  },
};

export default function IndicatorsPage() {
  return (
    <SitePageShell
      title="지표 해설"
      description="Charto에서 자주 쓰는 기술지표를 어떤 의미로 해석하는지 간단명료하게 정리합니다."
    >
      <section>
        <h2 className="text-base font-bold text-slate-950 dark:text-slate-50">이동평균선</h2>
        <p className="mt-3 break-keep">
          5일선은 아주 짧은 흐름, 20일선은 단기 추세의 중심을 보여줍니다. 현재가가 5일선과 20일선 위에 있으면
          단기 매수 우위로 해석하고, 아래에 있으면 아직 회복이 완전히 확인되지 않은 상태로 봅니다. 다만 평균선
          돌파만으로 추세 전환을 단정하지 않고 거래량과 모멘텀을 함께 확인합니다.
        </p>
      </section>
      <section>
        <h2 className="text-base font-bold text-slate-950 dark:text-slate-50">RSI</h2>
        <p className="mt-3 break-keep">
          RSI는 최근 상승과 하락의 힘을 비교한 모멘텀 지표입니다. 일반적으로 70 부근 이상은 과열, 30 부근 이하는
          과매도로 해석하지만, 강한 추세 구간에서는 과열권에 오래 머무를 수 있습니다. 그래서 Charto는 숫자만
          보여주는 대신, 과열인지 추세 유지인지 문장으로 같이 설명합니다.
        </p>
      </section>
      <section>
        <h2 className="text-base font-bold text-slate-950 dark:text-slate-50">MACD</h2>
        <p className="mt-3 break-keep">
          MACD는 추세의 방향과 탄력 변화를 보는 지표입니다. MACD 선이 시그널 선 위에 있고 히스토그램이 플러스면
          모멘텀이 유지되는 쪽으로 해석합니다. 반대로 히스토그램이 줄어들면 상승 추세 안에서도 힘이 약해지는
          신호일 수 있어, 단기 눌림이나 둔화 가능성을 같이 봅니다.
        </p>
      </section>
      <section>
        <h2 className="text-base font-bold text-slate-950 dark:text-slate-50">볼린저 밴드</h2>
        <p className="mt-3 break-keep">
          볼린저 밴드는 평균 대비 가격 변동 폭을 확인하는 지표입니다. 상단권은 강한 추세일 수도 있지만 과열일 수도
          있고, 하단권은 약세 압력일 수도 있지만 반등 후보 자리일 수도 있습니다. 그래서 Charto는 밴드 위치를 RSI,
          MACD, 거래량과 묶어서 해석합니다.
        </p>
      </section>
      <section>
        <h2 className="text-base font-bold text-slate-950 dark:text-slate-50">거래량과 수급</h2>
        <p className="mt-3 break-keep">
          가격이 움직여도 거래량이 받쳐주지 않으면 추세 신뢰도가 약할 수 있습니다. 반대로 거래량이 평균보다 크게
          늘고 외인·기관 순매수까지 붙으면 단기 추세의 힘을 더 높게 봅니다. Charto는 거래량 상태와 외인·기관
          패널을 같이 배치해 이런 차이를 한 번에 비교할 수 있게 했습니다.
        </p>
      </section>
      <section>
        <h2 className="text-base font-bold text-slate-950 dark:text-slate-50">지지선과 저항선</h2>
        <p className="mt-3 break-keep">
          지지선은 눌림이 나와도 다시 매수세가 붙을 수 있는 구간, 저항선은 이익 실현이나 매물 압력이 나올 수 있는
          구간입니다. 숫자 하나를 절대 기준으로 쓰기보다, 가격이 해당 구간에 접근할 때 거래량과 모멘텀이 같이
          살아 있는지까지 보는 편이 더 실전적입니다.
        </p>
      </section>
    </SitePageShell>
  );
}
