import { describe, expect, it } from "vitest";

import { classifyDisclosureKind, summarizeEarningsContext } from "@/lib/analysis/earnings-context.server";
import type { CompanyContext, EarningsDisclosureItem } from "@/lib/types";

const companyContext: CompanyContext = {
  group: "삼성",
  instrumentLabel: "개별 종목",
  sector: "반도체",
  businessSummary: "메모리와 시스템 반도체 수요, 설비투자 사이클에 민감한 대표 반도체 기업입니다.",
  industryFlow: "반도체 업종은 AI 서버 투자와 재고 정상화 기대에 영향을 받는 편입니다.",
  marketPosition: "업황 기대가 살아날수록 주가 탄력이 빠르게 붙을 수 있습니다.",
  confidence: "high",
  interpretWithCaution: false,
  cautionNote: null,
};

function disclosure(kind: EarningsDisclosureItem["kind"], title: string): EarningsDisclosureItem {
  return {
    date: "2026-03-01",
    title,
    url: "https://dart.fss.or.kr",
    kind,
  };
}

describe("classifyDisclosureKind", () => {
  it("classifies earnings-related disclosures", () => {
    expect(classifyDisclosureKind("연결재무제표 기준 영업(잠정)실적(공정공시)")).toBe("earnings");
  });

  it("classifies IR disclosures", () => {
    expect(classifyDisclosureKind("기업설명회(IR) 개최")).toBe("ir");
  });

  it("classifies outlook or guidance-style disclosures", () => {
    expect(classifyDisclosureKind("투자판단관련주요경영사항(수주계약체결)")).toBe("guidance");
  });
});

describe("summarizeEarningsContext", () => {
  it("builds summary and outlook from recent disclosures", () => {
    const latest = disclosure("earnings", "연결재무제표 기준 영업(잠정)실적(공정공시)");
    const guidance = disclosure("ir", "기업설명회(IR) 개최");
    const summary = summarizeEarningsContext(companyContext, latest, latest, guidance);

    expect(summary.available).toBe(true);
    expect(summary.summary).toContain("최근 실적 공시");
    expect(summary.outlook).toContain("IR");
  });
});
