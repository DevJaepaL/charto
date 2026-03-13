import type { Metadata } from "next";

import { SitePageShell } from "@/components/site-page-shell";

export const metadata: Metadata = {
  title: "문의",
  description: "Charto 문의 및 제보 안내",
};

export default function ContactPage() {
  return (
    <SitePageShell
      title="문의"
      description="오류 제보, 개선 제안, 협업 문의는 아래 채널을 통해 남길 수 있습니다."
    >
      <section>
        <h2 className="text-base font-bold text-slate-950 dark:text-slate-50">이메일</h2>
        <p className="mt-3 break-keep">
          간단한 문의나 협업 제안은 메일로 바로 연락할 수 있습니다.
        </p>
        <a
          className="mt-3 inline-flex rounded-full border border-slate-200/80 px-4 py-2 text-sm font-semibold text-[var(--brand-strong)] transition-colors hover:bg-[var(--surface-card)] dark:border-white/10 dark:hover:bg-white/[0.04]"
          href="mailto:wocks3254@gmail.com"
        >
          wocks3254@gmail.com
        </a>
      </section>

      <section className="mt-8">
        <h2 className="text-base font-bold text-slate-950 dark:text-slate-50">GitHub Issues</h2>
        <p className="mt-3 break-keep">
          버그 제보나 기능 제안은 아래 저장소의 Issues를 이용해 주세요.
        </p>
        <a
          className="mt-3 inline-flex rounded-full border border-slate-200/80 px-4 py-2 text-sm font-semibold text-[var(--brand-strong)] transition-colors hover:bg-[var(--surface-card)] dark:border-white/10 dark:hover:bg-white/[0.04]"
          href="https://github.com/DevJaepaL/charto/issues"
          target="_blank"
          rel="noreferrer"
        >
          GitHub Issues 열기
        </a>
      </section>
    </SitePageShell>
  );
}
