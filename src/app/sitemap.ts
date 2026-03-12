import type { MetadataRoute } from "next";

const BASE_URL = "https://charto.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return ["", "/about", "/privacy", "/disclaimer", "/contact"].map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: now,
  }));
}
