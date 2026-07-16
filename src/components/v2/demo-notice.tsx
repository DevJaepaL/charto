export function DemoNotice({ show }: { show: boolean }) {
  if (!show) {
    return null;
  }

  return (
    <span
      className="inline-flex items-center gap-1 rounded-[var(--radius-xs)] border border-[var(--warning-border)] bg-[var(--warning-surface)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--warning-icon)]"
      title="토스증권 API 자격증명이 없어 예시 데이터를 표시하고 있습니다"
    >
      예시 데이터
    </span>
  );
}
