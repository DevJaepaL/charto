import { formatChangeRate } from "@/lib/market-v2/compute";
import type { MarketOverviewPayload } from "@/lib/market-v2/view-types";
import { changeColorClass } from "@/components/v2/price-format";

function OverviewChip({
  label,
  value,
  sub,
  subClassName,
}: {
  label: string;
  value: string;
  sub?: string;
  subClassName?: string;
}) {
  return (
    <div className="surface-card flex min-w-[8.5rem] shrink-0 flex-col gap-1 rounded-[8px] px-3.5 py-2.5">
      <span className="text-[11px] font-semibold text-[var(--text-softest)]">{label}</span>
      <div className="flex items-baseline gap-1.5">
        <span className="font-mono text-[15px] font-bold tracking-tight text-[var(--text-main)]">{value}</span>
        {sub ? <span className={`font-mono text-xs font-semibold ${subClassName ?? ""}`}>{sub}</span> : null}
      </div>
    </div>
  );
}

function marketStatusChip(label: string, isBusinessDay: boolean | null) {
  const text = isBusinessDay === null ? "—" : isBusinessDay ? "개장일" : "휴장일";
  const tone =
    isBusinessDay === null
      ? "text-[var(--text-softest)]"
      : isBusinessDay
        ? "text-[var(--positive-text)]"
        : "text-[var(--text-soft)]";

  return (
    <div className="surface-card flex min-w-[7rem] shrink-0 flex-col gap-1 rounded-[8px] px-3.5 py-2.5">
      <span className="text-[11px] font-semibold text-[var(--text-softest)]">{label}</span>
      <span className={`text-[13px] font-bold ${tone}`}>{text}</span>
    </div>
  );
}

export function MarketOverviewStrip({ overview }: { overview: MarketOverviewPayload }) {
  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
      {overview.indices.map((index) => (
        <OverviewChip
          key={index.symbol}
          label={index.label}
          value={
            index.lastPrice !== null
              ? index.lastPrice.toLocaleString("ko-KR", { maximumFractionDigits: 2 })
              : "—"
          }
          sub={formatChangeRate(index.changeRate)}
          subClassName={changeColorClass(index.changeRate)}
        />
      ))}
      <OverviewChip
        label="달러 환율"
        value={overview.usdKrw.rate !== null ? `${overview.usdKrw.rate.toLocaleString("ko-KR")}원` : "—"}
        sub={overview.usdKrw.changeType === "UP" ? "▲" : overview.usdKrw.changeType === "DOWN" ? "▼" : undefined}
        subClassName={
          overview.usdKrw.changeType === "UP"
            ? "text-[var(--price-up)]"
            : overview.usdKrw.changeType === "DOWN"
              ? "text-[var(--price-down)]"
              : undefined
        }
      />
      <OverviewChip
        label="국채 10년"
        value={overview.bond10y !== null ? `${overview.bond10y.toFixed(2)}%` : "—"}
      />
      {marketStatusChip("국내 증시", overview.krBusinessDay)}
      {marketStatusChip("미국 증시", overview.usBusinessDay)}
    </div>
  );
}
