import { describe, expect, it } from "vitest";

import {
  buildOfficialContextFromIndustryCode,
  inferCompanyContext,
  inferInstrumentProfile,
  mergeCompanyContexts,
} from "@/lib/analysis/company-context";
import stocks from "@/data/stocks-snapshot.json";
import type { CompanyContext, StockLookupItem } from "@/lib/types";

function buildStock(name: string): StockLookupItem {
  return {
    symbol: "000000",
    isin: "KR7000000000",
    name,
    market: "KOSPI",
  };
}

describe("inferCompanyContext", () => {
  it.each([
    ["삼성전자", "반도체"],
    ["뉴파워프라즈마", "반도체"],
    ["LS ELECTRIC", "전력·전선"],
    ["현대차", "자동차"],
    ["HD현대에너지솔루션", "태양광·신재생에너지"],
    ["LG에너지솔루션", "2차전지"],
    ["흥구석유", "정유·에너지"],
    ["LG화학", "화학"],
    ["유한양행", "바이오·제약"],
    ["에스엠", "엔터테인먼트"],
    ["스튜디오드래곤", "미디어·콘텐츠"],
    ["NAVER", "인터넷·플랫폼·게임"],
    ["더존비즈온", "소프트웨어·AI"],
    ["두산로보틱스", "로봇·자동화"],
    ["HD한국조선해양", "조선·중공업"],
    ["한화에어로스페이스", "방산"],
    ["현대건설", "건설"],
    ["SK리츠", "리츠·부동산"],
    ["KB금융", "금융"],
    ["POSCO홀딩스", "철강·소재"],
    ["SK텔레콤", "통신"],
    ["대한항공", "여행·항공·레저"],
    ["이마트", "유통·리테일"],
    ["삼양식품", "식품·소비재"],
    ["아모레퍼시픽", "화장품"],
    ["루닛", "의료기기·헬스케어"],
    ["HMM", "해운·물류"],
    ["한국전력", "유틸리티·에너지인프라"],
    ["F&F", "의류·패션"],
    ["메가스터디교육", "교육"],
    ["케이비제30호스팩", "스팩"],
  ])("classifies %s into %s", (name, sector) => {
    const context = inferCompanyContext(buildStock(name));

    expect(context.sector).toBe(sector);
  });

  it("classifies HD현대에너지솔루션 as solar and renewable energy", () => {
    const context = inferCompanyContext(buildStock("HD현대에너지솔루션"));

    expect(context.sector).toBe("태양광·신재생에너지");
  });

  it("keeps LG에너지솔루션 in the secondary battery sector", () => {
    const context = inferCompanyContext(buildStock("LG에너지솔루션"));

    expect(context.sector).toBe("2차전지");
  });

  it("classifies KODEX 200 인버스 as an exchange traded product", () => {
    const context = inferCompanyContext(buildStock("KODEX 200 인버스"));

    expect(context.instrumentLabel).toContain("ETF");
    expect(context.sector).toBe("인버스 ETF/ETN");
  });

  it("does not describe unmatched KOSPI names as market-leading blue chips", () => {
    const context = inferCompanyContext(buildStock("흥구석유"));

    expect(context.sector).toBe("정유·에너지");
    expect(context.businessSummary).not.toContain("시장 대표주");
  });

  it("classifies major entertainment agencies with caution-aware sector metadata", () => {
    const context = inferCompanyContext(buildStock("에스엠"));

    expect(context.sector).toBe("엔터테인먼트");
    expect(context.interpretWithCaution).toBe(true);
    expect(context.marketPosition).toContain("변동성");
  });

  it("produces valid context for the entire stock snapshot and covers diverse sectors", () => {
    const contexts = (stocks as StockLookupItem[]).map((stock) => inferCompanyContext(stock));
    const sectorCount = new Set(contexts.map((context) => context.sector)).size;
    const etpCount = contexts.filter((context) => context.instrumentLabel.includes("ETF") || context.instrumentLabel.includes("ETN")).length;

    expect(contexts.every((context) => context.sector.length > 0)).toBe(true);
    expect(contexts.every((context) => context.businessSummary.length > 0)).toBe(true);
    expect(contexts.every((context) => context.marketPosition.length > 0)).toBe(true);
    expect(sectorCount).toBeGreaterThanOrEqual(25);
    expect(etpCount).toBeGreaterThan(300);
  });
});

describe("official company context merge", () => {
  it("maps official industry code 90 to entertainment", () => {
    const stock = buildStock("에스엠");
    const official = buildOfficialContextFromIndustryCode(
      stock,
      inferInstrumentProfile(stock),
      "901",
    );

    expect(official?.sector).toBe("엔터테인먼트");
    expect(official?.interpretWithCaution).toBe(true);
  });

  it("maps official industry code 29271 to semiconductor equipment instead of automotive", () => {
    const stock = {
      ...buildStock("뉴파워프라즈마"),
      symbol: "144960",
      market: "KOSDAQ" as const,
    };
    const official = buildOfficialContextFromIndustryCode(
      stock,
      inferInstrumentProfile(stock),
      "29271",
    );
    const merged = mergeCompanyContexts(inferCompanyContext(stock), official);

    expect(official?.sector).toBe("반도체");
    expect(merged.sector).toBe("반도체");
    expect(merged.marketPosition).toContain("업황");
  });

  it("maps broad official industry code 29 to machinery, not automotive", () => {
    const stock = buildStock("가상의장비주");
    const official = buildOfficialContextFromIndustryCode(
      stock,
      inferInstrumentProfile(stock),
      "29210",
    );

    expect(official?.sector).toBe("기계·장비");
  });

  it("maps official industry code 30 to automotive", () => {
    const stock = buildStock("가상의자동차주");
    const official = buildOfficialContextFromIndustryCode(
      stock,
      inferInstrumentProfile(stock),
      "30300",
    );

    expect(official?.sector).toBe("자동차");
  });

  it("prefers official context when inferred classification is low-confidence fallback", () => {
    const stock = buildStock("가상의일반주");
    const merged = mergeCompanyContexts(
      inferCompanyContext(stock),
      buildOfficialContextFromIndustryCode(stock, inferInstrumentProfile(stock), "620"),
    );

    expect(merged.sector).toBe("소프트웨어·AI");
    expect(merged.confidence).toBe("high");
  });

  it("keeps specific inferred sector when official industry code is broader", () => {
    const stock = buildStock("삼성전자");
    const inferred = inferCompanyContext(stock);
    const official = buildOfficialContextFromIndustryCode(
      stock,
      inferInstrumentProfile(stock),
      "264",
    );
    const merged = mergeCompanyContexts(inferred, official);

    expect(inferred.sector).toBe("반도체");
    expect(official?.sector).toBe("전자·IT하드웨어");
    expect(merged.sector).toBe("반도체");
    expect(merged.cautionNote).toContain("공식 업종코드");
  });

  it("returns inferred context when no official mapping exists", () => {
    const stock = buildStock("테스트종목");
    const inferred = inferCompanyContext(stock);
    const merged = mergeCompanyContexts(inferred, null as CompanyContext | null);

    expect(merged).toEqual(inferred);
  });
});
