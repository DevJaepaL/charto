/** 한국식 주가색: 상승 = 빨강, 하락 = 파랑 */
export function changeColorClass(rate: number | null): string {
  if (rate === null || !Number.isFinite(rate) || Math.abs(rate) < 0.00005) {
    return "text-[var(--text-soft)]";
  }
  return rate > 0 ? "text-[var(--price-up)]" : "text-[var(--price-down)]";
}

/**
 * 히트맵 타일 배경색.
 * 등락률 크기(±3% 포화)에 비례해 주가색의 투명도를 올린다.
 */
export function heatmapTileBackground(rate: number | null): string {
  if (rate === null || !Number.isFinite(rate)) {
    return "var(--surface-card-strong)";
  }

  const intensity = Math.min(Math.abs(rate) / 0.03, 1);
  const alpha = 0.06 + intensity * 0.38;

  return rate >= 0 ? `rgba(213, 58, 73, ${alpha.toFixed(3)})` : `rgba(52, 133, 250, ${alpha.toFixed(3)})`;
}
