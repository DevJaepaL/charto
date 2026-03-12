import snapshot from "@/data/stocks-snapshot.json";
import { FEATURED_SYMBOLS } from "@/lib/constants";
import type { StockLookupItem } from "@/lib/types";

const STOCKS = snapshot as StockLookupItem[];
const FEATURED_SET = new Set<string>(FEATURED_SYMBOLS as readonly string[]);
const FEATURED_ORDER = new Map<string, number>(
  (FEATURED_SYMBOLS as readonly string[]).map((symbol, index) => [symbol, index]),
);

function scoreItem(item: StockLookupItem, query: string) {
  const normalizedName = item.name.toLowerCase();
  const normalizedQuery = query.toLowerCase();

  if (item.symbol === query) {
    return 100;
  }

  if (item.symbol.startsWith(query)) {
    return 80;
  }

  if (normalizedName === normalizedQuery) {
    return 70;
  }

  if (normalizedName.startsWith(normalizedQuery)) {
    return 60;
  }

  if (normalizedName.includes(normalizedQuery)) {
    return 40;
  }

  return 0;
}

export function getStockBySymbol(symbol: string) {
  return STOCKS.find((item) => item.symbol === symbol) ?? null;
}

export function getFeaturedStocks() {
  return STOCKS.filter((item) => FEATURED_SET.has(item.symbol)).sort(
    (left, right) =>
      (FEATURED_ORDER.get(left.symbol) ?? Number.MAX_SAFE_INTEGER) -
      (FEATURED_ORDER.get(right.symbol) ?? Number.MAX_SAFE_INTEGER),
  );
}

export function searchStocks(query: string, limit = 10) {
  const trimmed = query.trim();

  if (!trimmed) {
    return getFeaturedStocks().slice(0, limit);
  }

  return STOCKS.map((item) => ({
    item,
    score: scoreItem(item, trimmed),
  }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => {
      if (left.score !== right.score) {
        return right.score - left.score;
      }

      return left.item.name.localeCompare(right.item.name, "ko-KR");
    })
    .slice(0, limit)
    .map((entry) => entry.item);
}
