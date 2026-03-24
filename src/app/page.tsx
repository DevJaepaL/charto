import { HomePageClient } from "@/components/home-page-client";
import { getServerAuthSession } from "@/lib/auth";
import { getFeaturedStocks } from "@/lib/stock-master";

export default async function Home() {
  const featured = getFeaturedStocks();
  const session = await getServerAuthSession();
  const userName = session?.user?.name?.trim() || "로그인 사용자";
  const userKey = session?.user?.id?.trim() || null;

  return (
    <HomePageClient
      featured={featured}
      isSignedIn={Boolean(session?.user)}
      userKey={userKey}
      userName={userName}
    />
  );
}
