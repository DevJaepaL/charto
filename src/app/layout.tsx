import type { Metadata } from "next";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/next";

import { AdSenseScript } from "@/components/adsense-script";
import { JsonLdScript } from "@/components/json-ld";
import { ThemeToggle } from "@/components/theme-toggle";
import { SiteHeader } from "@/components/v2/site-header";
import { getAdSenseClientId } from "@/lib/adsense";
import { getSiteUrl, getSiteUrlObject } from "@/lib/site-url";
import "./globals.css";

const siteUrl = getSiteUrl();
const adSenseClientId = getAdSenseClientId();

const SITE_TITLE = "CHARTO";
const SITE_DESCRIPTION =
  "국내·미국 증시의 섹터 히트맵, 대표 ETF 구성 종목, 자금 동향을 한눈에 보는 마켓 대시보드";

export const metadata: Metadata = {
  metadataBase: getSiteUrlObject(),
  title: {
    default: SITE_TITLE,
    template: "%s | Charto",
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    siteName: "Charto",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

const rootStructuredData = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Charto",
    url: siteUrl,
    inLanguage: "ko-KR",
    description: SITE_DESCRIPTION,
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
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-gov-dynamic-subset.min.css"
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
        {adSenseClientId ? (
          <meta name="google-adsense-account" content={adSenseClientId} />
        ) : null}
        <JsonLdScript data={rootStructuredData} id="charto-structured-data" />
      </head>
      <body className="bg-[var(--surface-0)] text-[var(--text-main)] antialiased">
        <div className="app-shell flex min-h-screen flex-col">
          <SiteHeader />
          <div className="flex-1">{children}</div>
          <footer className="px-4 pb-8 pt-4 text-xs text-slate-500 dark:text-slate-400 md:px-5">
            <div className="mx-auto flex max-w-5xl flex-col items-center justify-center gap-2.5 border-t border-slate-200/70 pt-4 text-center dark:border-white/10">
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
              </div>
              <p className="max-w-xl text-[11px] leading-4 text-slate-400 dark:text-slate-500">
                시세 제공: 토스증권 Open API. 본 서비스의 모든 정보는 투자 참고용이며 투자 권유가 아닙니다.
              </p>
              <ThemeToggle />
              <span>© 2026 이재찬 All Rights Reserved.</span>
            </div>
          </footer>
        </div>
        <AdSenseScript />
        <Analytics />
      </body>
    </html>
  );
}
