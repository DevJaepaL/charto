import { describe, expect, it } from "vitest";

import { buildDemoHeatmap, buildDemoRankings, buildDemoSectorDetail } from "@/lib/market-v2/demo";
import { KR_SECTORS } from "@/lib/market-v2/sectors";

describe("데모 데이터", () => {
  it("결정적이다 — 같은 입력이면 같은 출력", () => {
    expect(buildDemoHeatmap("KR")).toEqual(buildDemoHeatmap("KR"));
    expect(buildDemoRankings("US", "gainers")).toEqual(buildDemoRankings("US", "gainers"));
    expect(buildDemoSectorDetail(KR_SECTORS[0])).toEqual(buildDemoSectorDetail(KR_SECTORS[0]));
  });

  it("모든 페이로드에 isDemo가 표시된다", () => {
    expect(buildDemoHeatmap("KR").isDemo).toBe(true);
    expect(buildDemoRankings("KR", "amount").isDemo).toBe(true);
    expect(buildDemoSectorDetail(KR_SECTORS[0]).isDemo).toBe(true);
  });

  it("히트맵 타일은 섹터 수와 일치하고 수익률이 채워져 있다", () => {
    const heatmap = buildDemoHeatmap("KR");
    expect(heatmap.tiles).toHaveLength(KR_SECTORS.length);
    for (const tile of heatmap.tiles) {
      expect(tile.returns["1d"]).not.toBeNull();
      expect(Math.abs(tile.returns["1d"] ?? 0)).toBeLessThanOrEqual(0.035);
    }
  });

  it("급상승 랭킹은 양수, 급하락 랭킹은 음수 등락률", () => {
    for (const row of buildDemoRankings("KR", "gainers").rows) {
      expect(row.changeRate ?? 0).toBeGreaterThanOrEqual(0);
    }
    for (const row of buildDemoRankings("KR", "losers").rows) {
      expect(row.changeRate ?? 0).toBeLessThanOrEqual(0);
    }
  });

  it("섹터 상세 구성 종목은 시총 내림차순", () => {
    const detail = buildDemoSectorDetail(KR_SECTORS[0]);
    const caps = detail.constituents.map((row) => row.marketCap ?? 0);
    expect(caps).toEqual([...caps].sort((a, b) => b - a));
  });
});
