import Link from "next/link";
import type { ReactNode } from "react";

export function SitePageShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto max-w-3xl px-5 pb-14 pt-8 md:px-8 md:pb-20 md:pt-12">
      <div className="glass-card rounded-[28px] p-5 md:p-8">
        <Link
          className="text-sm font-semibold text-[var(--brand-strong)] transition-opacity hover:opacity-80"
          href="/"
        >
          ← Charto 홈으로
        </Link>
        <h1 className="mt-5 text-2xl font-black tracking-tight text-slate-950 dark:text-slate-50 md:text-[2rem]">
          {title}
        </h1>
        <p className="mt-3 break-keep text-sm leading-6 text-slate-600 dark:text-slate-300">
          {description}
        </p>
        <div className="mt-6 space-y-6 text-sm leading-6 text-slate-700 dark:text-slate-200">
          {children}
        </div>
      </div>
    </main>
  );
}
