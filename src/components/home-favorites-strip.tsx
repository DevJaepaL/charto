"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IconStarFilled } from "@tabler/icons-react";

import { StockAvatar } from "@/components/stock-avatar";
import { getFavoritesEventName, readFavoriteStocksForUser } from "@/lib/favorites";
import type { StockLookupItem } from "@/lib/types";

interface HomeFavoritesStripProps {
  userKey: string | null;
}

export function HomeFavoritesStrip({ userKey }: HomeFavoritesStripProps) {
  const [loadedUserKey, setLoadedUserKey] = useState<string | null>(null);
  const [items, setItems] = useState<StockLookupItem[]>([]);

  useEffect(() => {
    if (!userKey || typeof window === "undefined") {
      return;
    }

    let active = true;

    const syncFavorites = async () => {
      const nextItems = await readFavoriteStocksForUser(userKey);
      if (active) {
        setLoadedUserKey(userKey);
        setItems(nextItems);
      }
    };

    void syncFavorites();

    const eventName = getFavoritesEventName();
    const handleUpdate = (event: Event) => {
      const detail = (event as CustomEvent<{ userKey?: string }>).detail;
      if (detail?.userKey && detail.userKey !== userKey) {
        return;
      }

      void syncFavorites();
    };

    window.addEventListener(eventName, handleUpdate as EventListener);
    return () => {
      active = false;
      window.removeEventListener(eventName, handleUpdate as EventListener);
    };
  }, [userKey]);

  const visibleItems = loadedUserKey === userKey ? items.slice(0, 4) : [];

  if (!userKey || !visibleItems.length) {
    return null;
  }

  const extraCount = Math.max(items.length - visibleItems.length, 0);

  return (
    <div className="home-favorites-strip">
      <div className="home-favorites-label inline-flex items-center gap-1.5">
        <IconStarFilled size={12} className="text-amber-500" />
        <span>관심종목</span>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {visibleItems.map((item) => (
          <Link
            key={item.symbol}
            className="home-favorite-chip"
            href={`/analyze/${item.symbol}`}
          >
            <StockAvatar size="xs" stock={item} />
            <span className="truncate">{item.name}</span>
          </Link>
        ))}
        {extraCount ? <div className="home-favorite-chip">+{extraCount}</div> : null}
      </div>
    </div>
  );
}
