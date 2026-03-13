"use client";

import { signIn, signOut } from "next-auth/react";

type AuthProviderItem = {
  id: "google" | "kakao";
  name: string;
};

export function AuthActions({
  isSignedIn = false,
  providers,
  userName,
}: {
  isSignedIn?: boolean;
  providers: AuthProviderItem[];
  userName?: string | null;
}) {
  if (!providers.length) {
    return (
      <div className="rounded-[18px] border border-slate-200/80 bg-[var(--surface-card)] px-4 py-3 text-[13px] leading-5 text-slate-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
        현재 AI 분석은 테스트 중이에요. 기다려주세요.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {isSignedIn ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-[18px] border border-slate-200/80 bg-[var(--surface-card)] px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
          <div className="text-[13px] text-slate-600 dark:text-slate-200">
            <span className="font-semibold text-slate-900 dark:text-slate-50">{userName ?? "로그인 사용자"}</span>
            <span className="ml-1">계정으로 로그인되어 있습니다.</span>
          </div>
          <button
            className="brand-outline-hover rounded-full px-3 py-1.5 text-xs font-semibold"
            type="button"
            onClick={() => signOut({ callbackUrl: window.location.href })}
          >
            로그아웃
          </button>
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {providers.map((provider) => (
            <button
              key={provider.id}
              className={`rounded-[16px] border px-4 py-3 text-sm font-semibold transition-colors ${
                provider.id === "google"
                  ? "border-slate-200 bg-white text-slate-900 hover:border-slate-300 dark:border-white/12 dark:bg-white/[0.04] dark:text-slate-50"
                  : "border-[#FEE500] bg-[#FEE500] text-[#191600] hover:brightness-[0.98]"
              }`}
              type="button"
              onClick={() => signIn(provider.id, { callbackUrl: window.location.href })}
            >
              {provider.name}로 로그인
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
