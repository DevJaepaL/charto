import type { Metadata } from "next";

import { SitePageShell } from "@/components/site-page-shell";

export const metadata: Metadata = {
  title: "면책 고지",
  description: "투자 관련 면책 고지",
  robots: {
    index: false,
    follow: true,
  },
};

export default function DisclaimerPage() {
  return (
    <SitePageShell
      title="면책 고지"
      description="CHARTO가 제공하는 시세, 히트맵, 랭킹, 시장 지표는 모두 참고용 정보입니다."
    >
      <section>
        <h2 className="text-base font-bold text-slate-950 dark:text-slate-50">투자 판단</h2>
        <p className="mt-3 break-keep">
          본 서비스의 모든 데이터와 시각화는 정보 제공 목적이며, 특정 종목·섹터·ETF의 매수·매도 또는 투자수익을 보장하지 않습니다.
        </p>
      </section>
      <section>
        <h2 className="text-base font-bold text-slate-950 dark:text-slate-50">데이터 한계</h2>
        <p className="mt-3 break-keep">
          섹터 분류와 대표 ETF, 주요 구성 종목 목록은 자체 큐레이션 기준으로 실제 지수·ETF 편입 내역과 다를 수 있습니다.
          시세는 제공처 사정에 따라 지연되거나 일시적으로 예시 데이터로 대체될 수 있으며, 시가총액은 현재가 × 발행주식수로 계산한 참고치입니다.
        </p>
      </section>
      <section>
        <h2 className="text-base font-bold text-slate-950 dark:text-slate-50">책임 제한</h2>
        <p className="mt-3 break-keep">
          본 서비스를 참고해 발생한 투자 손실이나 의사결정의 결과에 대한 책임은 사용자 본인에게 있습니다.
        </p>
      </section>
    </SitePageShell>
  );
}
