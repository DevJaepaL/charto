import { describe, expect, it } from "vitest";

import { compactAiField } from "@/lib/analysis/ai-summary";

describe("compactAiField", () => {
  it("completes dangling obligation endings", () => {
    expect(
      compactAiField(
        "강한 상승 추세와 거래량 동반으로 긍정적 흐름이나, 과열권 진입으로 인한 눌림 가능성을 염두에 두어야.",
        120,
      ),
    ).toBe(
      "강한 상승 추세와 거래량 동반으로 긍정적 흐름이나, 과열권 진입으로 인한 눌림 가능성을 염두에 두어야 합니다.",
    );
  });

  it("converts dangling connective endings into complete sentences", () => {
    expect(compactAiField("현재가는 저항선에 근접했으나", 120)).toBe(
      "현재가는 저항선에 근접해 있습니다.",
    );
  });

  it("normalizes abrupt warning endings", () => {
    expect(
      compactAiField(
        "RSI가 과열권에 진입하여 단기 눌림 가능성이 있으니, 과도한 추격 매수는 지양해야.",
        120,
      ),
    ).toBe(
      "RSI가 과열권에 진입하여 단기 눌림 가능성이 있으니, 과도한 추격 매수는 지양하는 편이 좋습니다.",
    );
  });
});
