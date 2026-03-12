const MINI_BARS = [
  { height: "34%", tone: "muted" },
  { height: "48%", tone: "down" },
  { height: "42%", tone: "muted" },
  { height: "62%", tone: "up" },
  { height: "54%", tone: "up" },
  { height: "72%", tone: "up" },
  { height: "64%", tone: "muted" },
  { height: "86%", tone: "up" },
  { height: "78%", tone: "up" },
  { height: "58%", tone: "muted" },
];

function getBarClassName(tone: (typeof MINI_BARS)[number]["tone"]) {
  switch (tone) {
    case "up":
      return "bg-[rgba(240,66,81,0.82)]";
    case "down":
      return "bg-[rgba(52,133,250,0.82)]";
    default:
      return "bg-[rgba(148,163,184,0.58)]";
  }
}

export function HeroPreviewCard() {
  return (
    <div className="relative overflow-hidden rounded-[26px] border border-slate-200/80 bg-[var(--surface-card-strong)] p-3 text-slate-900 shadow-[0_20px_42px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#10141d] dark:text-white dark:shadow-[0_30px_80px_rgba(2,6,23,0.34)] md:rounded-[30px] md:p-4">
      <div className="relative">
        <div className="flex flex-col items-start gap-1.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="surface-pill inline-flex rounded-full px-3 py-1 text-[11px] font-semibold tracking-[0.08em] text-slate-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200">
            분석 미리보기
          </div>
          <div className="max-w-full truncate text-[10px] font-medium text-slate-500 dark:text-slate-400 sm:max-w-[140px] sm:text-right sm:text-[11px]">
            005930 · 삼성전자
          </div>
        </div>

        <div className="mt-3 grid gap-2.5 lg:grid-cols-[minmax(0,1.1fr)_minmax(160px,0.9fr)] md:mt-4 md:gap-3">
          <div className="surface-card rounded-[20px] p-3 dark:border-white/8 dark:bg-white/[0.03] md:rounded-[24px] md:p-4">
            <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-[11px] font-semibold tracking-[0.1em] text-slate-500 dark:text-slate-400">
                  최근 흐름
                </div>
                <div className="mt-1 text-lg font-black tracking-tight text-slate-900 dark:text-white md:text-xl">192,500원</div>
              </div>
              <div className="rounded-full bg-[rgba(240,66,81,0.14)] px-2.5 py-1 text-xs font-bold text-[var(--price-up)]">
                +2.45%
              </div>
            </div>

            <div className="mt-4 flex h-28 items-end gap-1.5 sm:h-36 sm:gap-2">
              {MINI_BARS.map((bar, index) => (
                <span
                  key={`${bar.tone}-${index}`}
                  className={`w-full rounded-full ${getBarClassName(bar.tone)}`}
                  style={{ height: bar.height }}
                />
              ))}
            </div>

            <div className="mt-3 flex items-center justify-between text-[10px] font-medium text-slate-500 dark:text-slate-500">
              <span>1주</span>
              <span>1개월</span>
              <span>1년</span>
            </div>
          </div>

          <div className="space-y-2.5 md:space-y-3">
            <div className="surface-card rounded-[20px] p-3 dark:border-white/8 dark:bg-white/[0.03] md:rounded-[24px] md:p-4">
              <div className="text-[11px] font-semibold tracking-[0.1em] text-slate-500 dark:text-slate-400">
                추천 점수
              </div>
              <div className="mt-2 flex flex-wrap items-end gap-2">
                <div className="text-[1.7rem] font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl">+34</div>
                <div className="mb-1 rounded-full bg-[rgba(5,192,114,0.16)] px-2.5 py-1 text-[11px] font-bold text-[var(--positive-text)]">
                  추천
                </div>
              </div>
              <div className="mt-3 h-2 rounded-full bg-slate-200/80 dark:bg-white/10">
                <div className="h-2 w-[67%] rounded-full bg-[var(--brand)]" />
              </div>
              <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">핵심 지표가 우호적인 흐름입니다.</div>
            </div>

            <div className="surface-card rounded-[20px] p-3 dark:border-white/8 dark:bg-white/[0.03] md:rounded-[24px] md:p-4">
              <div className="text-[11px] font-semibold tracking-[0.1em] text-slate-500 dark:text-slate-400">
                핵심 포인트
              </div>
              <ul className="mt-3 space-y-2 text-[13px] leading-5 text-slate-700 dark:text-slate-200 md:text-sm">
                <li className="surface-pill rounded-full px-3 py-1.5 dark:border-white/10 dark:bg-white/[0.04] md:py-2">20일선 위에서 흐름 유지</li>
                <li className="surface-pill rounded-full px-3 py-1.5 dark:border-white/10 dark:bg-white/[0.04] md:py-2">거래량은 평균 대비 안정적</li>
                <li className="surface-pill rounded-full px-3 py-1.5 dark:border-white/10 dark:bg-white/[0.04] md:py-2">AI 브리핑으로 업종 맥락 확인</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
