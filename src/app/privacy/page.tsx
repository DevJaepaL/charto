import type { Metadata } from "next";

import { SitePageShell } from "@/components/site-page-shell";

export const metadata: Metadata = {
  title: "개인정보처리방침",
  description: "Charto 개인정보처리방침",
};

export default function PrivacyPage() {
  return (
    <SitePageShell
      title="개인정보처리방침"
      description="Charto는 서비스 운영에 필요한 최소한의 정보만 처리합니다."
    >
      <section>
        <h2 className="text-base font-bold text-slate-950 dark:text-slate-50">수집하는 정보</h2>
        <p className="mt-3 break-keep">
          로그인 기능을 사용할 경우 Google 또는 Kakao OAuth를 통해 이름, 이메일, 프로필 이미지 등 기본 계정 정보가 전달될 수 있습니다.
          서비스는 별도 회원 DB 없이 세션 중심으로 로그인 상태를 유지합니다.
        </p>
      </section>
      <section>
        <h2 className="text-base font-bold text-slate-950 dark:text-slate-50">자동 수집 정보</h2>
        <p className="mt-3 break-keep">
          서비스 품질 개선을 위해 Vercel Analytics를 사용할 수 있으며, 테마 설정 등 일부 정보는 브라우저의 localStorage에 저장됩니다.
        </p>
      </section>
      <section>
        <h2 className="text-base font-bold text-slate-950 dark:text-slate-50">제3자 서비스</h2>
        <p className="mt-3 break-keep">
          시세 데이터는 한국투자 Open API, 기업 메타데이터는 Open DART, AI 브리핑은 Google Gemini API를 사용할 수 있습니다.
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
