import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AnalysisPageArticle } from "@/components/analysis-page-article";
import { JsonLdScript } from "@/components/json-ld";
import { AnalysisPageClient } from "@/components/analysis-page-client";
import { getGeminiApiKeyCount } from "@/lib/analysis/ai-summary";
import { loadTechnicalResponse } from "@/lib/analysis/load-analysis-data";
import { configuredAuthProviders, getServerAuthSession } from "@/lib/auth";
import { FEATURED_SYMBOLS } from "@/lib/constants";
import { getSiteUrl } from "@/lib/site-url";
import { getFeaturedStocks, getStockBySymbol } from "@/lib/stock-master";

export const dynamic = "force-dynamic";

const indexedAnalyzeSymbols = new Set<string>(FEATURED_SYMBOLS);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ symbol: string }>;
}): Promise<Metadata> {
  const { symbol } = await params;
  const stock = getStockBySymbol(symbol);

  if (!stock) {
    return {
      title: "종목을 찾을 수 없습니다",
    };
  }

  return {
    title: `${stock.name} 차트 분석`,
    description: `${stock.name}(${stock.symbol})의 기술지표와 AI 요약을 확인하는 분석 페이지`,
    alternates: {
      canonical: `/analyze/${stock.symbol}`,
    },
    robots: {
      index: indexedAnalyzeSymbols.has(stock.symbol),
      follow: true,
    },
    openGraph: {
      url: `/analyze/${stock.symbol}`,
      title: `${stock.name} 차트 분석`,
      description: `${stock.name}(${stock.symbol})의 기술지표와 AI 요약을 확인하는 분석 페이지`,
    },
    twitter: {
      title: `${stock.name} 차트 분석`,
      description: `${stock.name}(${stock.symbol})의 기술지표와 AI 요약을 확인하는 분석 페이지`,
    },
  };
}

export default async function AnalyzePage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = await params;
  const stock = getStockBySymbol(symbol);

  if (!stock) {
    notFound();
  }

  const [session, technicalPayload] = await Promise.all([
    getServerAuthSession(),
    loadTechnicalResponse(stock.symbol, "1d", "max").catch(() => null),
  ]);
  const isAiUserSignedIn = Boolean(session?.user);
  const shouldAutoFetchAi = isAiUserSignedIn && getGeminiApiKeyCount() > 1;
  const favoriteUserKey = session?.user?.id?.trim() || null;
  const siteUrl = getSiteUrl();
  const pageStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${stock.name} 차트 분석`,
    description: `${stock.name}(${stock.symbol})의 기술지표와 AI 요약을 확인하는 분석 페이지`,
    url: `${siteUrl}/analyze/${stock.symbol}`,
    inLanguage: "ko-KR",
    isPartOf: {
      "@type": "WebSite",
      name: "Charto",
      url: siteUrl,
    },
    about: {
      "@type": "Thing",
      name: stock.name,
      identifier: stock.symbol,
    },
  } as const;

  return (
    <>
      <JsonLdScript data={pageStructuredData} id={`analyze-${stock.symbol}-structured-data`} />
      <AnalysisPageClient
        aiProviders={configuredAuthProviders.map(({ id, name }) => ({ id, name }))}
        aiUserName={session?.user?.name}
        favoriteUserKey={favoriteUserKey}
        featured={getFeaturedStocks()}
        initialError={null}
        initialRecommendationSignal={null}
        initialTechnicalPayload={technicalPayload}
        isAiUserSignedIn={isAiUserSignedIn}
        shouldAutoFetchAi={shouldAutoFetchAi}
        stock={stock}
      />
      <AnalysisPageArticle stock={stock} technicalPayload={technicalPayload} />
    </>
  );
}
