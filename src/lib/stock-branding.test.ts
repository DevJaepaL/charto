import { describe, expect, it } from "vitest";

import { getStockBrandProfile } from "@/lib/stock-branding";
import type { StockLookupItem } from "@/lib/types";

function makeStock(name: string, symbol = "000000"): StockLookupItem {
  return {
    symbol,
    isin: `KR${symbol.padEnd(10, "0")}`,
    name,
    market: "KOSPI",
  };
}

describe("stock-branding", () => {
  it("maps samsung affiliates to the samsung logo", () => {
    const profile = getStockBrandProfile(makeStock("삼성바이오로직스"));

    expect(profile.logoSrc).toBe("/logos/samsung.svg");
  });

  it("maps doosan affiliates to the doosan logo", () => {
    const profile = getStockBrandProfile(makeStock("두산테스나"));

    expect(profile.logoSrc).toBe("/logos/doosan.svg");
  });

  it("keeps sk hynix on the dedicated brand logo", () => {
    const profile = getStockBrandProfile(makeStock("SK하이닉스"));

    expect(profile.logoSrc).toBe("/logos/sk-hynix.svg");
  });

  it("builds a generated svg mark when no official logo is mapped", () => {
    const profile = getStockBrandProfile(makeStock("우리기술"));

    expect(profile.logoType).toBe("generated");
    expect(profile.logoSrc.startsWith("data:image/svg+xml")).toBe(true);
  });

  it("keeps generated fallback colors valid for alphanumeric symbols", () => {
    const profile = getStockBrandProfile(makeStock("삼양엔씨켐", "0120G0"));

    expect(profile.logoType).toBe("generated");
    expect(profile.accent.includes("NaN")).toBe(false);
    expect(profile.gradientFrom.includes("NaN")).toBe(false);
    expect(profile.gradientTo.includes("NaN")).toBe(false);
  });
});
