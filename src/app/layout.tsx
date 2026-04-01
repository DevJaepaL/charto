import type { Metadata } from "next";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/next";

import { JsonLdScript } from "@/components/json-ld";
import { ThemeToggle } from "@/components/theme-toggle";
import { getSiteUrl, getSiteUrlObject } from "@/lib/site-url";
import "./globals.css";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: getSiteUrlObject(),
  title: {
    default: "CHARTO | 국내 증시 차트를 추적해보세요.",
    template: "%s | Charto",
  },
  description:
    "국내 주식 차트를 바탕으로 각종 보조지표 분석과 AI 요약을 한 화면에서 확인하는 기술 분석 웹앱",
  openGraph: {
    title: "CHARTO | 국내 증시 차트를 추적해보세요.",
    description:
      "한국 주식 차트와 기술지표, AI 요약을 모바일에서도 보기 좋게 제공하는 분석 도구",
    siteName: "Charto",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CHARTO | 국내 증시 차트를 추적해보세요.",
    description:
      "국내 증시 종목별 기술지표 분석과 AI 요약까지 확인하는 국내 주식 분석 툴",
  },
};

const rootStructuredData = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Charto",
    url: siteUrl,
    inLanguage: "ko-KR",
    description:
      "국내 주식 차트를 바탕으로 각종 보조지표 분석과 AI 요약을 한 화면에서 확인하는 기술 분석 웹앱",
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Charto",
    url: siteUrl,
    logo: `${siteUrl}/icon.svg`,
  },
] as const;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="dark" data-theme="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&display=optional"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var stored=localStorage.getItem('charto-theme');var theme=stored||'dark';if(!stored){localStorage.setItem('charto-theme',theme);}document.documentElement.classList.toggle('dark',theme==='dark');document.documentElement.dataset.theme=theme;}catch(e){document.documentElement.classList.add('dark');document.documentElement.dataset.theme='dark';}})();`,
          }}
        />
        <JsonLdScript data={rootStructuredData} id="charto-structured-data" />
      </head>
      <body className="bg-[var(--surface-0)] text-[var(--text-main)] antialiased">
        <div className="app-shell flex min-h-screen flex-col">
          <div className="flex-1">{children}</div>
          <footer className="px-4 pb-8 pt-4 text-xs text-slate-500 dark:text-slate-400 md:px-5">
            <div className="mx-auto flex max-w-[30rem] flex-col items-center justify-center gap-2.5 border-t border-slate-200/70 pt-4 text-center dark:border-white/10">
              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] font-medium text-slate-500 dark:text-slate-300">
                <Link className="hover:text-slate-900 dark:hover:text-slate-50" href="/about">
                  서비스 소개
                </Link>
                <Link className="hover:text-slate-900 dark:hover:text-slate-50" href="/privacy">
                  개인정보처리방침
                </Link>
                <Link className="hover:text-slate-900 dark:hover:text-slate-50" href="/disclaimer">
                  면책 고지
                </Link>
                <Link className="hover:text-slate-900 dark:hover:text-slate-50" href="/contact">
                  문의
                </Link>
                <Link className="hover:text-slate-900 dark:hover:text-slate-50" href="/login">
                  로그인
                </Link>
              </div>
              <ThemeToggle />
              <span>© 2026 이재찬 All Rights Reserved.</span>
            </div>
          </footer>
        </div>
        <Analytics />
      </body>
    </html>
  );
}
