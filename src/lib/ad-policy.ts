/**
 * 광고를 노출할 수 있는 경로 정책.
 * 콘텐츠가 충분한 페이지(홈 대시보드·섹터 상세·소개)에만 광고를 허용한다.
 */
export function isPathEligibleForAds(pathname: string | null | undefined) {
  const path = pathname?.split("?")[0]?.replace(/\/+$/, "") || "/";

  if (path === "/" || path === "/about") {
    return true;
  }

  return path.startsWith("/sector/");
}
