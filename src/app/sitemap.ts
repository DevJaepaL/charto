import type { MetadataRoute } from "next";

import { FEATURED_SYMBOLS } from "@/lib/constants";
import { GUIDE_ARTICLES } from "@/lib/guide-content";
import { getSiteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const siteUrl = getSiteUrl();

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
      priority: 0.7,
    },
    {
      url: `${siteUrl}/guide`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    ...GUIDE_ARTICLES.map((article) => ({
      url: `${siteUrl}/guide/${article.slug}`,
      lastModified: new Date(article.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.75,
    })),
    ...FEATURED_SYMBOLS.map((symbol) => ({
      url: `${siteUrl}/analyze/${symbol}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
  ];
}
