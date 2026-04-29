import { FEATURED_SYMBOLS } from "@/lib/constants";

const FEATURED_ANALYZE_PATHS = new Set(
  (FEATURED_SYMBOLS as readonly string[]).map((symbol) => `/analyze/${symbol}`),
);

export function isPathEligibleForAds(pathname: string | null | undefined) {
  const path = pathname?.split("?")[0]?.replace(/\/+$/, "") || "/";

  if (path === "/" || path === "/about" || path === "/guide") {
    return true;
  }

  if (path.startsWith("/guide/")) {
    return true;
  }

  return FEATURED_ANALYZE_PATHS.has(path);
}
