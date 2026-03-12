import { describe, expect, it } from "vitest";

import { getStockBySymbol, searchStocks } from "@/lib/stock-master";

describe("stock-master", () => {
  it("finds a stock by exact symbol", () => {
    const stock = getStockBySymbol("005930");

    expect(stock?.name).toBe("삼성전자");
  });

  it("searches by company name and symbol", () => {
    expect(searchStocks("삼성전").some((item) => item.symbol === "005930")).toBe(true);
    expect(searchStocks("005930")[0]?.name).toBe("삼성전자");
  });
});
