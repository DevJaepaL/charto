"use client";

import type { StockLookupItem } from "@/lib/types";

const FAVORITES_PREFIX = "charto:favorites:";
const FAVORITES_EVENT = "charto:favorites-updated";
const MAX_FAVORITES = 24;

function getFavoritesKey(userKey: string) {
  return `${FAVORITES_PREFIX}${userKey}`;
}

function sanitizeFavorites(value: unknown): StockLookupItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (item): item is StockLookupItem =>
        Boolean(
          item &&
            typeof item === "object" &&
            "symbol" in item &&
            "name" in item &&
            "market" in item &&
            "isin" in item,
        ),
    )
    .map((item) => ({
      symbol: String(item.symbol),
      name: String(item.name),
      market: item.market as StockLookupItem["market"],
      isin: String(item.isin),
    }))
    .slice(0, MAX_FAVORITES);
}

export function readFavoriteStocks(userKey: string | null | undefined) {
  if (!userKey || typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(getFavoritesKey(userKey));
    if (!raw) {
      return [];
    }

    return sanitizeFavorites(JSON.parse(raw));
  } catch {
    return [];
  }
}

function writeFavoriteStocks(userKey: string, items: StockLookupItem[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(getFavoritesKey(userKey), JSON.stringify(items.slice(0, MAX_FAVORITES)));
  window.dispatchEvent(
    new CustomEvent(FAVORITES_EVENT, {
      detail: { userKey },
    }),
  );
}

async function requestFavorites(input: RequestInfo, init?: RequestInit) {
  try {
    const response = await fetch(input, init);
    const payload = (await response.json().catch(() => null)) as
      | { items?: StockLookupItem[]; fallback?: string }
      | null;

    if (!response.ok || payload?.fallback === "local" || !Array.isArray(payload?.items)) {
      return null;
    }

    return sanitizeFavorites(payload.items);
  } catch {
    return null;
  }
}

export async function readFavoriteStocksForUser(userKey: string) {
  const remoteItems = await requestFavorites("/api/favorites", {
    cache: "no-store",
  });

  if (remoteItems) {
    writeFavoriteStocks(userKey, remoteItems);
    return remoteItems;
  }

  return readFavoriteStocks(userKey);
}

export function toggleFavoriteStock(userKey: string, stock: StockLookupItem) {
  const current = readFavoriteStocks(userKey);
  const exists = current.some((item) => item.symbol === stock.symbol);
  const next = exists
    ? current.filter((item) => item.symbol !== stock.symbol)
    : [stock, ...current.filter((item) => item.symbol !== stock.symbol)].slice(0, MAX_FAVORITES);

  writeFavoriteStocks(userKey, next);
  return next;
}

export function removeFavoriteStock(userKey: string, symbol: string) {
  const next = readFavoriteStocks(userKey).filter((item) => item.symbol !== symbol);
  writeFavoriteStocks(userKey, next);
  return next;
}

export function isFavoriteStock(userKey: string | null | undefined, symbol: string) {
  return readFavoriteStocks(userKey).some((item) => item.symbol === symbol);
}

export function getFavoritesEventName() {
  return FAVORITES_EVENT;
}

export async function toggleFavoriteStockForUser(userKey: string, stock: StockLookupItem) {
  const remoteItems = await requestFavorites("/api/favorites", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(stock),
  });

  if (remoteItems) {
    writeFavoriteStocks(userKey, remoteItems);
    return remoteItems;
  }

  return toggleFavoriteStock(userKey, stock);
}

export async function removeFavoriteStockForUser(userKey: string, symbol: string) {
  const remoteItems = await requestFavorites("/api/favorites", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ symbol }),
  });

  if (remoteItems) {
    writeFavoriteStocks(userKey, remoteItems);
    return remoteItems;
  }

  return removeFavoriteStock(userKey, symbol);
}
