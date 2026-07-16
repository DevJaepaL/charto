import type { Metadata } from "next";

import { getMarketOverview, getMarketRankings, getSectorHeatmap } from "@/lib/market-v2/service";
import { AdSlot } from "@/components/ad-slot";
import { InvestorFlowPanel } from "@/components/v2/investor-flow-panel";
import { MarketOverviewStrip } from "@/components/v2/market-overview-strip";
import { RankingsPanel } from "@/components/v2/rankings-panel";
import { SectorHeatmapBoard } from "@/components/v2/sector-heatmap-board";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
  openGraph: {
    url: "/",
  },
};

export default async function Home() {
  const [overview, heatmap, rankings] = await Promise.all([
    getMarketOverview(),
    getSectorHeatmap("KR"),
    getMarketRankings("KR", "gainers"),
  ]);

  return (
    <main className="mx-auto max-w-5xl px-4 pb-14 pt-6 md:px-6 md:pt-8">
      <div className="mb-5">
        <h1 className="text-xl font-bold tracking-tight text-[var(--text-main)] md:text-2xl">
          오늘 시장의 큰 흐름
        </h1>
        <p className="mt-1 text-sm text-[var(--text-soft)]">
          국내·미국 증시의 섹터 흐름과 자금 동향을 한 화면에서 확인하세요.
        </p>
      </div>

      <MarketOverviewStrip overview={overview} />

      <div className="mt-4">
        <SectorHeatmapBoard initialHeatmap={heatmap} />
      </div>

      <AdSlot className="mt-4" slot={process.env.NEXT_PUBLIC_ADSENSE_HOME_SLOT} />

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RankingsPanel initialRankings={rankings} />
        <InvestorFlowPanel overview={overview} />
      </div>
    </main>
  );
}
