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
    <div
      className="relative overflow-hidden rounded-[22px] border border-slate-200/80 bg-[var(--surface-card-strong)] p-3 text-slate-900 shadow-[0_18px_36px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#10141d] dark:text-white dark:shadow-[0_24px_60px_rgba(2,6,23,0.3)]"
      data-home-preview-card
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-7 -top-7 h-24 w-24 rounded-full bg-[rgba(73,178,255,0.18)] blur-3xl"
        data-home-preview-orb="primary"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-9 -left-7 h-28 w-28 rounded-full bg-[rgba(5,192,114,0.14)] blur-3xl"
        data-home-preview-orb="secondary"
      />
      <div className="relative">
        <div className="flex items-start justify-between gap-2">
          <div
            className="surface-pill inline-flex rounded-full px-2.5 py-0.75 text-[10px] font-semibold tracking-[0.08em] text-slate-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200"
            data-home-preview-pill
          >
            분석 미리보기
          </div>
          <div
            className="max-w-[132px] truncate text-right text-[9px] font-medium text-slate-500 dark:text-slate-400"
            data-home-preview-pill
          >
            005930 · 삼성전자
          </div>
        </div>

        <div className="mt-2.5 grid gap-2">
          <div
            className="surface-card rounded-[18px] p-2.5 dark:border-white/8 dark:bg-white/[0.03]"
            data-home-preview-section
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-[10px] font-semibold tracking-[0.1em] text-slate-500 dark:text-slate-400">
                  최근 흐름
                </div>
                <div className="mt-1 text-[1rem] font-black tracking-tight text-slate-900 dark:text-white">
                  192,500원
                </div>
              </div>
              <div
                className="rounded-full bg-[rgba(240,66,81,0.14)] px-2 py-0.75 text-[10px] font-bold text-[var(--price-up)]"
                data-home-preview-pill
              >
                +2.45%
              </div>
            </div>

            <div className="mt-3 flex h-24 items-end gap-1.25">
              {MINI_BARS.map((bar, index) => (
                <span
                  key={`${bar.tone}-${index}`}
                  className={`origin-bottom w-full rounded-full ${getBarClassName(bar.tone)}`}
                  data-home-preview-bar
                  style={{ height: bar.height }}
                />
              ))}
            </div>

            <div className="mt-2.5 flex items-center justify-between text-[9px] font-medium text-slate-500 dark:text-slate-500">
              <span>1주</span>
              <span>1개월</span>
              <span>1년</span>
            </div>
          </div>

          <div className="grid gap-2">
            <div
              className="surface-card rounded-[18px] p-2.5 dark:border-white/8 dark:bg-white/[0.03]"
              data-home-preview-section
            >
              <div className="text-[10px] font-semibold tracking-[0.1em] text-slate-500 dark:text-slate-400">
                추천 점수
              </div>
              <div className="mt-1.5 flex flex-wrap items-end gap-1.5">
                <div className="text-[1.45rem] font-black tracking-tight text-slate-900 dark:text-white">+34</div>
                <div
                  className="mb-0.5 rounded-full bg-[rgba(5,192,114,0.16)] px-2 py-0.75 text-[10px] font-bold text-[var(--positive-text)]"
                  data-home-preview-pill
                >
                  추천
                </div>
              </div>
              <div className="mt-2.5 h-1.5 rounded-full bg-slate-200/80 dark:bg-white/10">
                <div
                  className="h-1.5 w-[67%] origin-left rounded-full bg-[var(--brand)]"
                  data-home-preview-progress
                />
              </div>
              <div className="mt-1.5 text-[10px] text-slate-500 dark:text-slate-400">핵심 지표가 우호적인 흐름입니다.</div>
            </div>

            <div
              className="surface-card rounded-[18px] p-2.5 dark:border-white/8 dark:bg-white/[0.03]"
              data-home-preview-section
            >
              <div className="text-[10px] font-semibold tracking-[0.1em] text-slate-500 dark:text-slate-400">
                핵심 포인트
              </div>
              <ul className="mt-2.5 space-y-1.5 text-[11px] leading-4 text-slate-700 dark:text-slate-200">
                <li
                  className="surface-pill rounded-full px-2.5 py-1.25 dark:border-white/10 dark:bg-white/[0.04]"
                  data-home-preview-point
                >
                  20일선 위에서 흐름 유지
                </li>
                <li
                  className="surface-pill rounded-full px-2.5 py-1.25 dark:border-white/10 dark:bg-white/[0.04]"
                  data-home-preview-point
                >
                  거래량은 평균 대비 안정적
                </li>
                <li
                  className="surface-pill rounded-full px-2.5 py-1.25 dark:border-white/10 dark:bg-white/[0.04]"
                  data-home-preview-point
                >
                  AI 브리핑으로 업종 맥락 확인
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
