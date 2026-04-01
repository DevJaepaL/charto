import type { MetadataRoute } from "next";

import stocks from "@/data/stocks-snapshot.json";
import type { StockLookupItem } from "@/lib/types";
import { getSiteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const siteUrl = getSiteUrl();
  const items = stocks as StockLookupItem[];

  return [
    {
      url: `${siteUrl}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    ...items.map((item) => ({
      url: `${siteUrl}/analyze/${item.symbol}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
  ];
}
