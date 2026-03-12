import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AnalysisPageClient } from "@/components/analysis-page-client";
import { getGeminiApiKeyCount } from "@/lib/analysis/ai-summary";
import { getFeaturedStocks, getStockBySymbol } from "@/lib/stock-master";

export const dynamic = "force-dynamic";

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

  const shouldAutoFetchAi = getGeminiApiKeyCount() > 1;

  return (
    <AnalysisPageClient
      featured={getFeaturedStocks()}
      initialError={null}
      initialRecommendationSignal={null}
      initialTechnicalPayload={null}
      shouldAutoFetchAi={shouldAutoFetchAi}
      stock={stock}
    />
  );
}
