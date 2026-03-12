import type { Metadata } from "next";

import { SitePageShell } from "@/components/site-page-shell";

export const metadata: Metadata = {
  title: "면책 고지",
  description: "Charto 투자 관련 면책 고지",
};

export default function DisclaimerPage() {
  return (
    <SitePageShell
      title="면책 고지"
      description="Charto가 제공하는 차트, 지표, AI 브리핑은 모두 참고용 정보입니다."
    >
      <section>
        <h2 className="text-base font-bold text-slate-950 dark:text-slate-50">투자 판단</h2>
        <p className="mt-3 break-keep">
          본 서비스의 모든 데이터와 분석은 정보 제공 목적이며, 특정 종목의 매수·매도 또는 투자수익을 보장하지 않습니다.
        </p>
      </section>
      <section>
        <h2 className="text-base font-bold text-slate-950 dark:text-slate-50">AI 브리핑</h2>
        <p className="mt-3 break-keep">
          AI 브리핑은 기술적 지표와 기업 맥락을 요약한 자동 생성 결과로, 사실 관계나 해석의 정확성을 완전히 보장하지 않습니다.
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
