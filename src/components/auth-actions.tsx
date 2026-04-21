"use client";

import type { ReactNode } from "react";
import { signIn, signOut } from "next-auth/react";

type AuthProviderItem = {
  id: "google" | "kakao";
  name: string;
};

function GoogleIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none">
      <path
        d="M21.6 12.23c0-.71-.06-1.25-.2-1.82H12v3.48h5.52c-.11.86-.68 2.15-1.94 3.02l-.02.12 2.78 2.11.19.02c1.77-1.6 3.07-3.94 3.07-6.93Z"
        fill="#4285F4"
      />
      <path
        d="M12 21.75c2.7 0 4.97-.87 6.62-2.36l-3.15-2.25c-.84.57-1.96.97-3.47.97-2.64 0-4.88-1.71-5.68-4.07l-.12.01-2.89 2.19-.04.11A10.03 10.03 0 0 0 12 21.75Z"
        fill="#34A853"
      />
      <path
        d="M6.32 14.04A5.95 5.95 0 0 1 6 12c0-.71.12-1.4.32-2.04l-.01-.14-2.93-2.22-.1.04A9.8 9.8 0 0 0 2.25 12c0 1.56.38 3.03 1.03 4.36l3.04-2.32Z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.89c1.9 0 3.18.8 3.91 1.46l2.85-2.72C16.95 2.98 14.69 2.25 12 2.25c-3.93 0-7.3 2.2-8.72 5.39l3.04 2.32c.81-2.36 3.05-4.07 5.68-4.07Z"
        fill="#EA4335"
      />
    </svg>
  );
}

function KakaoIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 4c-4.97 0-9 3.17-9 7.07 0 2.44 1.56 4.59 3.93 5.86l-.79 3.08c-.07.27.24.48.48.33l3.75-2.48c.53.08 1.08.12 1.63.12 4.97 0 9-3.16 9-7.07C21 7.17 16.97 4 12 4Z"
        fill="#191600"
      />
    </svg>
  );
}

function ProviderIcon({ id }: { id: AuthProviderItem["id"] }) {
  return id === "google" ? <GoogleIcon /> : <KakaoIcon />;
}

function providerMeta(id: AuthProviderItem["id"]) {
  if (id === "google") {
    return {
      subcopy: "Google 계정으로 바로 시작",
      compactClass:
        "border-slate-200/90 bg-white text-slate-900 hover:border-slate-300 dark:border-white/12 dark:bg-white/[0.05] dark:text-slate-50",
      cardClass:
        "border-slate-200/90 bg-white text-slate-900 hover:border-slate-300 dark:border-white/12 dark:bg-white/[0.05] dark:text-slate-50",
      iconShellClass: "bg-white ring-1 ring-slate-200 dark:bg-slate-950/30 dark:ring-white/12",
    };
  }

  return {
    subcopy: "카카오 계정으로 빠르게 로그인",
    compactClass: "border-[#FEE500] bg-[#FEE500] text-[#191600] hover:brightness-[0.985]",
    cardClass: "border-[#FEE500] bg-[#FEE500] text-[#191600] hover:brightness-[0.985]",
    iconShellClass: "bg-[#FFF4AE] ring-1 ring-black/8",
  };
}

function AuthProviderButton({
  provider,
  variant,
}: {
  provider: AuthProviderItem;
  variant: "compact" | "page";
}) {
  const meta = providerMeta(provider.id);

  if (variant === "page") {
    return (
      <button
        className={`group flex w-full items-center gap-3 rounded-[22px] border px-4 py-4 text-left transition-all hover:-translate-y-0.5 ${meta.cardClass}`}
        type="button"
        onClick={() => signIn(provider.id, { callbackUrl: window.location.href })}
      >
        <span
          className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] ${meta.iconShellClass}`}
        >
          <ProviderIcon id={provider.id} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-black">{provider.name}</span>
          <span className="mt-0.5 block text-[12px] opacity-75">{meta.subcopy}</span>
        </span>
        {/* <span className="text-sm font-bold opacity-80 transition-transform group-hover:translate-x-0.5">
          계속
        </span> */}
      </button>
    );
  }

  return (
    <button
      className={`flex items-center justify-center gap-2 rounded-[14px] border px-3 py-2 text-[13px] font-semibold transition-colors ${meta.compactClass}`}
      type="button"
      onClick={() => signIn(provider.id, { callbackUrl: window.location.href })}
    >
      <ProviderIcon id={provider.id} />
      <span>{provider.name} 로그인</span>
    </button>
  );
}

export function AuthActions({
  isSignedIn = false,
  providers,
  userName,
  variant = "compact",
  helperText,
}: {
  isSignedIn?: boolean;
  providers: AuthProviderItem[];
  userName?: string | null;
  variant?: "compact" | "page";
  helperText?: ReactNode;
}) {
  if (!providers.length) {
    return (
      <div className="rounded-[18px] border border-slate-200/80 bg-[var(--surface-card)] px-4 py-3 text-[13px] leading-5 text-slate-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
        로그인 기능 준비 중. 현재 배포에서는 Google / Kakao 로그인이 제공되지 않습니다.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {isSignedIn ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-slate-200/80 bg-[var(--surface-card)] px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
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
        <>
          {helperText ? (
            <div className="text-[12px] leading-5 text-slate-500 dark:text-slate-300">{helperText}</div>
          ) : null}
          <div className={variant === "page" ? "grid gap-3" : "grid gap-2 sm:grid-cols-2"}>
            {providers.map((provider) => (
              <AuthProviderButton key={provider.id} provider={provider} variant={variant} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
