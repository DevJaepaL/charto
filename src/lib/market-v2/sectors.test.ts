import { describe, expect, it } from "vitest";

import { ALL_SECTORS, findSector, getSectorsByMarket, KR_SECTORS, US_SECTORS } from "@/lib/market-v2/sectors";

describe("섹터 카탈로그 무결성", () => {
  it("시장별 slug가 중복되지 않는다", () => {
    for (const sectors of [KR_SECTORS, US_SECTORS]) {
      const slugs = sectors.map((sector) => sector.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
    }
  });

  it("대표 ETF 심볼이 중복되지 않는다", () => {
    const symbols = ALL_SECTORS.map((sector) => sector.etf.symbol);
    expect(new Set(symbols).size).toBe(symbols.length);
  });

  it("KR 심볼은 6자리 숫자, US 심볼은 영문 티커 형식이다", () => {
    for (const sector of KR_SECTORS) {
      expect(sector.etf.symbol).toMatch(/^\d{6}$/);
      for (const stock of sector.constituents) {
        expect(stock.symbol).toMatch(/^\d{6}$/);
      }
    }
    for (const sector of US_SECTORS) {
      expect(sector.etf.symbol).toMatch(/^[A-Z][A-Z0-9.\-]{0,9}$/);
      for (const stock of sector.constituents) {
        expect(stock.symbol).toMatch(/^[A-Z][A-Z0-9.\-]{0,9}$/);
      }
    }
  });

  it("섹터 내 구성 종목이 중복되지 않는다", () => {
    for (const sector of ALL_SECTORS) {
      const symbols = sector.constituents.map((stock) => stock.symbol);
      expect(new Set(symbols).size, `${sector.market}/${sector.slug}`).toBe(symbols.length);
    }
  });

  it("모든 섹터는 구성 종목을 5개 이상 가진다", () => {
    for (const sector of ALL_SECTORS) {
      expect(sector.constituents.length, `${sector.market}/${sector.slug}`).toBeGreaterThanOrEqual(5);
    }
  });

  it("findSector가 시장·slug로 섹터를 찾는다", () => {
    expect(findSector("KR", "semiconductor")?.etf.symbol).toBe("091160");
    expect(findSector("US", "technology")?.etf.symbol).toBe("XLK");
    expect(findSector("KR", "does-not-exist")).toBeNull();
  });

  it("US는 GICS 11개 섹터를 전부 커버한다", () => {
    expect(getSectorsByMarket("US")).toHaveLength(11);
  });
});
