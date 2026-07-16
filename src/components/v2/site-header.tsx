import Link from "next/link";

import { BrandLogo } from "@/components/brand-logo";

export function SiteHeader() {
  return (
    <header className="border-b border-[var(--line-soft)]">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5 md:px-6">
        <BrandLogo size="sm" />
        <nav aria-label="주요 메뉴" className="flex items-center gap-1">
          <Link
            className="rounded-[var(--radius-sm)] px-2.5 py-1.5 text-[13px] font-semibold text-[var(--text-soft)] brand-soft-hover"
            href="/"
          >
            마켓
          </Link>
          <Link
            className="rounded-[var(--radius-sm)] px-2.5 py-1.5 text-[13px] font-semibold text-[var(--text-soft)] brand-soft-hover"
            href="/about"
          >
            소개
          </Link>
        </nav>
      </div>
    </header>
  );
}
