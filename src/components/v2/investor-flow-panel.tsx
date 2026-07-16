import { formatKrwCompact } from "@/lib/market-v2/compute";
import type { InvestorFlowSummary, MarketOverviewPayload } from "@/lib/market-v2/view-types";
import { DemoNotice } from "@/components/v2/demo-notice";
import { changeColorClass } from "@/components/v2/price-format";

const INVESTOR_ROWS: Array<{ key: keyof Pick<InvestorFlowSummary, "individualNet" | "foreignerNet" | "institutionNet">; label: string }> = [
  { key: "individualNet", label: "개인" },
  { key: "foreignerNet", label: "외국인" },
  { key: "institutionNet", label: "기관" },
];

function FlowBar({ value, max }: { value: number | null; max: number }) {
  if (value === null || max <= 0) {
    return <div className="h-1.5 flex-1 rounded-full bg-[var(--surface-pill)]" />;
  }

  const ratio = Math.min(Math.abs(value) / max, 1);
  const color = value >= 0 ? "var(--price-up)" : "var(--price-down)";

  return (
    <div className="flex h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--surface-pill)]">
      <div style={{ width: `${Math.round(ratio * 100)}%`, background: color, opacity: 0.75 }} />
    </div>
  );
}

function FlowCard({ flow }: { flow: InvestorFlowSummary }) {
  const max = Math.max(
    ...INVESTOR_ROWS.map((row) => Math.abs(flow[row.key] ?? 0)),
    1,
  );

  return (
    <div className="surface-card-strong flex-1 rounded-[8px] p-3.5">
      <div className="flex items-baseline justify-between">
        <h3 className="text-xs font-bold text-[var(--text-soft)]">{flow.market}</h3>
        {flow.date ? <span className="text-[10px] text-[var(--text-softest)]">{flow.date}</span> : null}
      </div>
      <ul className="mt-2.5 space-y-2.5">
        {INVESTOR_ROWS.map((row) => {
          const value = flow[row.key];
          return (
            <li key={row.key} className="flex items-center gap-2.5">
              <span className="w-10 shrink-0 text-xs font-semibold text-[var(--text-soft)]">{row.label}</span>
              <FlowBar max={max} value={value} />
              <span className={`w-20 shrink-0 text-right font-mono text-xs font-bold ${changeColorClass(value)}`}>
                {formatKrwCompact(value)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function InvestorFlowPanel({ overview }: { overview: MarketOverviewPayload }) {
  if (overview.investorFlows.length === 0) {
    return null;
  }

  return (
    <section aria-label="투자자 동향" className="surface-card rounded-[12px] p-4 md:p-5">
      <div className="flex items-center gap-2">
        <h2 className="text-base font-bold text-[var(--text-main)]">투자자 순매수</h2>
        <DemoNotice show={overview.isDemo} />
      </div>
      <p className="mt-1.5 text-xs text-[var(--text-softest)]">
        국내 증시의 투자자별 순매수 대금입니다 (매수 − 매도, 일별 집계).
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        {overview.investorFlows.map((flow) => (
          <FlowCard key={flow.market} flow={flow} />
        ))}
      </div>
    </section>
  );
}
