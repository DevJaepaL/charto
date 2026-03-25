import { HomePageClient } from "@/components/home-page-client";
import { loadTechnicalResponse } from "@/lib/analysis/load-analysis-data";
import { getServerAuthSession } from "@/lib/auth";
import { getFeaturedStocks } from "@/lib/stock-master";

async function getHomePreview() {
  const featured = getFeaturedStocks();
  const previewTarget = featured.find((item) => /^\d{6}$/.test(item.symbol)) ?? featured[0] ?? null;

  if (!previewTarget) {
    return {
      featured,
      preview: null,
    };
  }

  try {
    const preview = await loadTechnicalResponse(previewTarget.symbol, "1d", "3mo");

    if (preview.isDemo || preview.chartUnavailable || preview.candles.length < 10) {
      return {
        featured,
        preview: null,
      };
    }

    return {
      featured,
      preview,
    };
  } catch {
    return {
      featured,
      preview: null,
    };
  }
}

export default async function Home() {
  const [{ featured, preview }, session] = await Promise.all([
    getHomePreview(),
    getServerAuthSession(),
  ]);
  const userName = session?.user?.name?.trim() || "로그인 사용자";
  const userKey = session?.user?.id?.trim() || null;

  return (
    <HomePageClient
      featured={featured}
      isSignedIn={Boolean(session?.user)}
      preview={preview}
      userKey={userKey}
      userName={userName}
    />
  );
}
