import type { Metadata } from "next";

import { AuthActions } from "@/components/auth-actions";
import { SitePageShell } from "@/components/site-page-shell";
import { configuredAuthProviders, getServerAuthSession, isAuthEnabled } from "@/lib/auth";

export const metadata: Metadata = {
  title: "로그인",
  description: "Charto 로그인 및 AI 브리핑 사용 안내",
};

export default async function LoginPage() {
  const session = await getServerAuthSession();
  const providers = configuredAuthProviders.map(({ id, name }) => ({ id, name }));

  return (
    <SitePageShell
      title="로그인"
      description="Google 또는 Kakao 계정으로 로그인할 수 있습니다."
    >
      <section className="space-y-3">
        <h2 className="text-base font-black text-slate-950 dark:text-slate-50">로그인 선택</h2>
        <div className="mt-3">
          <AuthActions
            isSignedIn={Boolean(session?.user)}
            providers={providers}
            userName={session?.user?.name}
            variant="page"
            helperText={isAuthEnabled ? "편한 계정 하나를 눌러 바로 로그인하면 됩니다." : undefined}
          />
        </div>
        {!isAuthEnabled ? (
          <p className="break-keep text-sm text-slate-500 dark:text-slate-300">
            현재 배포에서는 OAuth 환경변수가 설정되지 않아 로그인 기능이 비활성화되어 있습니다.
          </p>
        ) : null}
      </section>
    </SitePageShell>
  );
}
