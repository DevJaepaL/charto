import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";

import { ThemeToggle } from "@/components/theme-toggle";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-noto-sans-kr",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://charto.vercel.app"),
  title: {
    default: "Charto | 국내 증시 차트를 추적해보세요.",
    template: "%s | Charto",
  },
  description:
    "국내 주식 차트를 바탕으로 이동평균, RSI, MACD, 볼린저 밴드와 AI 요약을 한 화면에서 확인하는 기술 분석 웹앱",
  openGraph: {
    title: "Charto | 국내 증시 차트를 추적해보세요.",
    description:
      "한국 주식 차트와 기술지표, AI 요약을 모바일에서도 보기 좋게 제공하는 분석 도구",
    siteName: "Charto",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Charto | 국내 증시 차트를 추적해보세요.",
    description:
      "분봉부터 주봉까지 한 번에 보고, 기술지표 해석과 AI 요약까지 확인하는 국내 주식 분석 툴",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="dark" data-theme="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var stored=localStorage.getItem('charto-theme');var theme=stored||'dark';document.documentElement.classList.toggle('dark',theme==='dark');document.documentElement.dataset.theme=theme;}catch(e){document.documentElement.classList.add('dark');document.documentElement.dataset.theme='dark';}})();`,
          }}
        />
      </head>
      <body className={`${notoSansKr.variable} bg-[var(--surface-0)] text-[var(--text-main)] antialiased`}>
        <div className="app-shell flex min-h-screen flex-col">
          <div className="border-b border-amber-200/80 bg-amber-50/90 px-5 py-2 text-center text-[11px] font-medium text-amber-900 dark:border-amber-400/18 dark:bg-amber-500/10 dark:text-amber-100 md:px-8 md:text-xs">
            초기 개발 버전으로 일부 기능이 불안정할 수 있습니다.
          </div>
          <div className="flex-1">{children}</div>
          <footer className="border-t border-slate-200/70 bg-[var(--surface-card)] px-5 pb-8 pt-4 text-xs text-slate-500 dark:border-white/10 dark:bg-[var(--surface-1)] dark:text-slate-400 md:px-8">
            <div className="flex flex-col items-center justify-center gap-2.5 text-center">
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
