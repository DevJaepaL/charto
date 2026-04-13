import type { Metadata } from "next";
import Link from "next/link";

import { SitePageShell } from "@/components/site-page-shell";
import { loadQuietAccumulation } from "@/lib/market/accumulation";
import { loadMarketRanking } from "@/lib/market/rankings";
import { formatCompactNumber, formatKoreanWon, formatPercent, formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "시장 요약",
  description: "거래대금, 거래량, 외인·기관 수급으로 보는 오늘의 국내 증시 요약",
  alternates: {
    canonical: "/market-overview",
  },
  openGraph: {
    url: "/market-overview",
    title: "시장 요약 | Charto",
    description: "거래대금, 거래량, 외인·기관 수급으로 보는 오늘의 국내 증시 요약",
  },
  twitter: {
    title: "시장 요약 | Charto",
    description: "거래대금, 거래량, 외인·기관 수급으로 보는 오늘의 국내 증시 요약",
  },
};

function formatOverviewTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default async function MarketOverviewPage() {
  const [valueRanking, volumeRanking, accumulation] = await Promise.all([
    loadMarketRanking("value"),
    loadMarketRanking("volume"),
    loadQuietAccumulation(6),
  ]);

  return (
    <SitePageShell
      title="시장 요약"
      description="거래대금, 거래량, 외인·기관 수급 기준으로 오늘 눈에 띄는 국내 증시 흐름을 정리합니다."
    >
      <section>
        <h2 className="text-base font-bold text-slate-950 dark:text-slate-50">오늘 체크한 기준</h2>
        <p className="mt-3 break-keep">
          이 페이지는 당일 거래대금 상위, 거래량 상위, 외인·기관 수급 포착 종목을 함께 보면서 시장의 중심이
          어디에 형성되는지 확인하기 위한 요약 페이지입니다. 장중에는 수급 상세 API 제한이 있어 일부 항목이
          추정치로 보정될 수 있으며, 마감 이후 수치와 소폭 차이가 날 수 있습니다.
        </p>
        <p className="mt-3 text-sm font-semibold text-[var(--brand-strong)]">
          마지막 업데이트: {formatOverviewTime(accumulation.asOf)}
        </p>
      </section>

      <section>
        <h2 className="text-base font-bold text-slate-950 dark:text-slate-50">거래대금이 몰린 종목</h2>
        <p className="mt-3 break-keep">
          거래대금은 실제 자금이 집중된 구간을 보는 데 유용합니다. 단순 등락률보다 어느 종목에 자금이 가장 많이
          붙었는지를 먼저 보면 시장의 중심 테마를 더 빠르게 읽을 수 있습니다.
        </p>
        <ul className="mt-4 space-y-3">
          {valueRanking.items.slice(0, 5).map((item) => (
            <li key={`value-${item.stock.symbol}`} className="break-keep">
              <Link className="font-semibold text-[var(--brand-strong)] hover:underline" href={`/analyze/${item.stock.symbol}`}>
                {item.stock.name}
              </Link>{" "}
              ({item.stock.symbol})은(는) 현재 {formatPrice(item.price)}, 전일 대비 {formatPercent(item.changePercent)} 흐름이며
              거래대금은 약 {formatCompactNumber(item.tradeValue)}원 수준입니다.
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-base font-bold text-slate-950 dark:text-slate-50">거래량이 크게 붙는 종목</h2>
        <p className="mt-3 break-keep">
          거래량 상위는 단기 과열과 초기 확산을 함께 보여줍니다. 거래대금이 아직 크지 않아도 거래량이 급증하는
          종목은 테마 확산 초기에 먼저 눈에 들어오는 경우가 많습니다.
        </p>
        <ul className="mt-4 space-y-3">
          {volumeRanking.items.slice(0, 5).map((item) => (
            <li key={`volume-${item.stock.symbol}`} className="break-keep">
              <Link className="font-semibold text-[var(--brand-strong)] hover:underline" href={`/analyze/${item.stock.symbol}`}>
                {item.stock.name}
              </Link>{" "}
              ({item.stock.symbol})은(는) 현재 {formatPrice(item.price)}, 전일 대비 {formatPercent(item.changePercent)}이며
              누적 거래량은 약 {formatCompactNumber(item.volume)}주입니다.
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-base font-bold text-slate-950 dark:text-slate-50">외인·기관 수급 포착 종목</h2>
        <p className="mt-3 break-keep">
          {accumulation.notice} 가격이 강한데 수급이 비어 있는 종목과, 수급까지 같이 붙는 종목은 추세 해석이 다르기
          때문에 이 패널을 별도로 분리해두었습니다.
        </p>
        <ul className="mt-4 space-y-3">
          {accumulation.items.length ? (
            accumulation.items.map((item) => (
              <li key={`acc-${item.stock.symbol}`} className="break-keep">
                <Link className="font-semibold text-[var(--brand-strong)] hover:underline" href={`/analyze/${item.stock.symbol}`}>
                  {item.stock.name}
                </Link>{" "}
                ({item.stock.symbol})은(는) 외인 {formatKoreanWon(item.foreignNetBuyAmount5d)}, 기관 {formatKoreanWon(item.institutionNetBuyAmount5d)}
                수급이 포착됐고 최근 등락률은 {formatPercent(item.priceChangePercent5d)}입니다.
              </li>
            ))
          ) : (
            <li>현재 기준으로 별도 수급 포착 종목이 없습니다.</li>
          )}
        </ul>
      </section>
    </SitePageShell>
  );
}
