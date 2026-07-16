import type { Metadata } from "next";

import { SitePageShell } from "@/components/site-page-shell";

export const metadata: Metadata = {
  title: "개인정보처리방침",
  description: "CHARTO 개인정보처리방침",
  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <SitePageShell
      title="개인정보처리방침"
      description="CHARTO는 서비스 운영에 필요한 최소한의 정보만 처리합니다."
    >
      <section>
        <h2 className="text-base font-bold text-slate-950 dark:text-slate-50">수집하는 정보</h2>
        <p className="mt-3 break-keep">
          CHARTO는 회원가입·로그인 기능이 없으며, 이름·이메일 등 개인 식별 정보를 직접 수집하지 않습니다.
        </p>
      </section>
      <section>
        <h2 className="text-base font-bold text-slate-950 dark:text-slate-50">자동 수집 정보</h2>
        <p className="mt-3 break-keep">
          서비스 품질 개선을 위해 Vercel Analytics를 사용할 수 있으며, 테마 설정 등 일부 정보는 브라우저의 localStorage에 저장됩니다.
          광고 기능을 활성화할 경우 Google AdSense가 쿠키나 기기 정보를 처리할 수 있습니다.
        </p>
      </section>
      <section>
        <h2 className="text-base font-bold text-slate-950 dark:text-slate-50">광고와 쿠키</h2>
        <p className="mt-3 break-keep">
          Google AdSense가 활성화된 페이지에서는 Google 또는 Google의 광고 파트너가 쿠키, 웹 비콘, IP 주소,
          기기 식별자 등 광고 제공에 필요한 정보를 처리할 수 있습니다. 이 정보는 맞춤 광고, 광고 성과 측정,
          부정 사용 방지, 광고 품질 개선에 사용될 수 있습니다.
        </p>
        <p className="mt-3 break-keep">
          Google이 파트너 사이트와 앱의 정보를 사용하는 방식은{" "}
          <a
            className="font-semibold text-[var(--brand-strong)] hover:underline"
            href="https://www.google.com/policies/privacy/partners/"
            rel="noreferrer"
            target="_blank"
          >
            Google 안내 페이지
          </a>
          에서 확인할 수 있습니다. 사용자는 브라우저 설정 또는 Google 광고 설정을 통해 쿠키와 맞춤 광고 관련
          선택을 조정할 수 있습니다.
        </p>
      </section>
      <section>
        <h2 className="text-base font-bold text-slate-950 dark:text-slate-50">제3자 서비스</h2>
        <p className="mt-3 break-keep">
          시세·랭킹·시장 지표 데이터는 토스증권 Open API를 사용합니다. 데이터 조회 과정에서 사용자의 개인정보가 외부로 전달되지 않습니다.
        </p>
      </section>
      <section>
        <h2 className="text-base font-bold text-slate-950 dark:text-slate-50">문의</h2>
        <p className="mt-3 break-keep">
          개인정보 관련 문의는 GitHub Issues를 통해 접수할 수 있습니다.
        </p>
      </section>
    </SitePageShell>
  );
}
