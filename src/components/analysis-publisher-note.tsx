import Link from "next/link";

import type { StockLookupItem, TechnicalResponse, TechnicalSnapshot } from "@/lib/types";
import {
  formatInteger,
  formatPercent,
  formatPrice,
  getBiasLabel,
} from "@/lib/utils";

function formatAsOf(payload: TechnicalResponse) {
  const latest = payload.candles.at(-1);

  if (!latest) {
    return "데이터 기준 시각을 확인 중입니다.";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(latest.time * 1000));
}

function getScoreSummary(score: number) {
  if (score >= 60) {
    return "상승 신호가 강하게 우세한 구간입니다.";
  }

  if (score >= 18) {
    return "상승 신호가 약세 신호보다 우세한 구간입니다.";
  }

  if (score <= -60) {
    return "약세 신호가 강하게 우세한 구간입니다.";
  }

  if (score <= -18) {
    return "약세 신호가 상승 신호보다 우세한 구간입니다.";
  }

  return "상승과 약세 신호가 엇갈리는 중립 구간입니다.";
}

function formatMetric(value: number | null | undefined, formatter: (value: number) => string) {
  return value === null || value === undefined ? "-" : formatter(value);
}

function buildMovingAverageCopy(technical: TechnicalSnapshot) {
  if (!technical.sma5 || !technical.sma20) {
    return "이동평균선 데이터가 충분하지 않아 단기 추세는 보수적으로 확인해야 합니다.";
  }

  const pricePosition =
    technical.currentPrice >= technical.sma20
      ? "현재가는 20일선 위에 있어 단기 추세가 유지되는 쪽에 가깝습니다"
      : "현재가는 20일선 아래에 있어 단기 추세 회복 확인이 필요합니다";
  const shortPosition =
    technical.sma5 >= technical.sma20
      ? "5일선도 20일선 위에 있어 최근 가격 반응은 상대적으로 강합니다"
      : "5일선은 20일선 아래에 있어 최근 가격 반응은 아직 약한 편입니다";

  return `${pricePosition}. ${shortPosition}.`;
}

function buildMomentumCopy(technical: TechnicalSnapshot) {
  const rsiCopy =
    technical.rsi14 === null
      ? "RSI 데이터는 아직 충분하지 않습니다"
      : technical.rsi14 >= 70
        ? `RSI는 ${technical.rsi14.toFixed(2)}로 과열권에 가까워 단기 변동성을 함께 봐야 합니다`
        : technical.rsi14 >= 55
          ? `RSI는 ${technical.rsi14.toFixed(2)}로 모멘텀이 유지되는 구간입니다`
          : technical.rsi14 <= 35
            ? `RSI는 ${technical.rsi14.toFixed(2)}로 약세권에 가까워 반등 확인이 필요합니다`
            : `RSI는 ${technical.rsi14.toFixed(2)}로 중립 구간에 있습니다`;
  const macdCopy =
    technical.macdHistogram === null
      ? "MACD 히스토그램은 아직 계산되지 않았습니다"
      : technical.macdHistogram >= 0
        ? "MACD 히스토그램은 플러스라 상승 탄력 항목이 우호적으로 반영됩니다"
        : "MACD 히스토그램은 마이너스라 단기 탄력 둔화를 점검해야 합니다";

  return `${rsiCopy}. ${macdCopy}.`;
}

export function AnalysisPublisherNote({
  stock,
  payload,
}: {
  stock: StockLookupItem;
  payload: TechnicalResponse | null;
}) {
  if (!payload || payload.isDemo || payload.chartUnavailable) {
    return (
      <section className="mx-auto max-w-6xl px-5 pb-16 pt-3 md:px-8 md:pb-24">
        <div className="border-t border-slate-200/80 pt-8 dark:border-white/10">
          <div className="text-[11px] font-black tracking-[0.16em] text-[var(--brand-strong)]">
            PUBLIC ANALYSIS NOTE
          </div>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950 dark:text-slate-50">
            {stock.name}({stock.symbol}) 공개 분석 노트
          </h2>
          <p className="mt-4 max-w-3xl break-keep text-sm leading-7 text-slate-600 dark:text-slate-300">
            이 종목은 현재 공개 차트 데이터를 충분히 불러오지 못했습니다. CHARTO는 데이터가 부족한 종목을
            강제로 평가하지 않고, 가격·거래량·이동평균선·모멘텀 지표가 함께 확인되는 경우에만 차트 신호를
            제공합니다. 다른 종목을 확인하거나 잠시 뒤 다시 조회해 주세요.
          </p>
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <article>
              <h3 className="text-base font-black text-slate-950 dark:text-slate-50">
                이 페이지에서 확인하는 항목
              </h3>
              <p className="mt-3 break-keep text-sm leading-7 text-slate-600 dark:text-slate-300">
                {stock.name}({stock.symbol}) 분석 페이지는 현재가, 등락률, 거래량, 5일·20일·60일
                이동평균선, RSI, MACD, 볼린저 밴드, 지지선과 저항선을 한 화면에서 비교하도록 구성되어
                있습니다. 단일 지표만으로 결론을 내리지 않고 추세, 모멘텀, 변동성, 수급 반응을 함께
                확인하는 방식입니다.
              </p>
            </article>
            <article>
              <h3 className="text-base font-black text-slate-950 dark:text-slate-50">
                데이터 부족 시 해석 원칙
              </h3>
              <p className="mt-3 break-keep text-sm leading-7 text-slate-600 dark:text-slate-300">
                실시간 시세 제공처가 응답하지 않거나 장 시작 직후처럼 캔들 수가 부족한 경우에는 차트 신호
                점수를 표시하지 않습니다. 이때는 최근 가격이 주요 이동평균선 위에 다시 안착하는지, 거래량이
                이전 평균보다 증가하는지, 과열권 또는 약세권 지표가 해소되는지를 순서대로 확인하는 편이
                안정적입니다.
              </p>
            </article>
            <article>
              <h3 className="text-base font-black text-slate-950 dark:text-slate-50">
                함께 읽으면 좋은 가이드
              </h3>
              <p className="mt-3 break-keep text-sm leading-7 text-slate-600 dark:text-slate-300">
                차트 신호 점수는 투자 권유가 아니라 공개 차트 데이터를 읽기 쉽게 압축한 참고 정보입니다.
                실제 판단에는 기업 공시, 실적 흐름, 시장 금리, 업종 수급, 개인의 투자 기간과 위험 허용
                범위를 함께 반영해야 합니다.
              </p>
            </article>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              className="inline-flex rounded-full border border-slate-200/80 px-4 py-2 text-sm font-semibold text-[var(--brand-strong)] transition-colors hover:bg-[var(--surface-card)] dark:border-white/10 dark:hover:bg-white/[0.04]"
              href="/guide/signal-score-methodology"
            >
              차트 신호 계산 방식
            </Link>
            <Link
              className="inline-flex rounded-full border border-slate-200/80 px-4 py-2 text-sm font-semibold text-[var(--brand-strong)] transition-colors hover:bg-[var(--surface-card)] dark:border-white/10 dark:hover:bg-white/[0.04]"
              href="/guide/moving-averages"
            >
              이동평균선 가이드
            </Link>
            <Link
              className="inline-flex rounded-full border border-slate-200/80 px-4 py-2 text-sm font-semibold text-[var(--brand-strong)] transition-colors hover:bg-[var(--surface-card)] dark:border-white/10 dark:hover:bg-white/[0.04]"
              href="/guide/rsi-macd"
            >
              RSI·MACD 가이드
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const { technical, signal, companyContext } = payload;
  const scoreLabel = signal.score > 0 ? `+${signal.score}` : `${signal.score}`;
  const reasons = signal.reasons.slice(0, 4);
  const risks = signal.risks.slice(0, 3);

  return (
    <section className="mx-auto max-w-6xl px-5 pb-16 pt-3 md:px-8 md:pb-24">
      <div className="border-t border-slate-200/80 pt-8 dark:border-white/10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div>
            <div className="text-[11px] font-black tracking-[0.16em] text-[var(--brand-strong)]">
              PUBLIC ANALYSIS NOTE
            </div>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950 dark:text-slate-50 md:text-[2rem]">
              {stock.name}({stock.symbol}) 차트 해석 요약
            </h2>
            <p className="mt-4 break-keep text-sm leading-7 text-slate-600 dark:text-slate-300">
              이 문단은 검색 엔진과 애드센스 검토 봇이 실제 본문을 확인할 수 있도록 서버에서 렌더링되는 공개
              분석 노트입니다. 차트 신호 점수는 매수·매도 지시가 아니라 가격, 이동평균선, RSI, MACD,
              거래량, 지지·저항을 함께 요약한 참고 지표입니다.
            </p>

            <dl className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="border-t border-slate-200/80 pt-3 dark:border-white/10">
                <dt className="text-[11px] font-bold tracking-[0.12em] text-slate-500 dark:text-slate-400">
                  현재가
                </dt>
                <dd className="mt-1 text-lg font-black text-slate-950 dark:text-slate-50">
                  {formatPrice(payload.quote.currentPrice)}
                </dd>
                <dd className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {formatPercent(payload.quote.changePercent)}
                </dd>
              </div>
              <div className="border-t border-slate-200/80 pt-3 dark:border-white/10">
                <dt className="text-[11px] font-bold tracking-[0.12em] text-slate-500 dark:text-slate-400">
                  차트 신호 점수
                </dt>
                <dd className="mt-1 text-lg font-black text-slate-950 dark:text-slate-50">
                  {scoreLabel}
                </dd>
                <dd className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {getBiasLabel(signal.bias)} · {getScoreSummary(signal.score)}
                </dd>
              </div>
              <div className="border-t border-slate-200/80 pt-3 dark:border-white/10">
                <dt className="text-[11px] font-bold tracking-[0.12em] text-slate-500 dark:text-slate-400">
                  거래량
                </dt>
                <dd className="mt-1 text-lg font-black text-slate-950 dark:text-slate-50">
                  {formatInteger(payload.quote.volume, "주")}
                </dd>
                <dd className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {technical.volumeStatus}
                </dd>
              </div>
              <div className="border-t border-slate-200/80 pt-3 dark:border-white/10">
                <dt className="text-[11px] font-bold tracking-[0.12em] text-slate-500 dark:text-slate-400">
                  기준 시각
                </dt>
                <dd className="mt-1 text-sm font-bold leading-6 text-slate-950 dark:text-slate-50">
                  {formatAsOf(payload)}
                </dd>
              </div>
            </dl>
          </div>

          <div className="grid gap-6">
            <article>
              <h3 className="text-base font-black text-slate-950 dark:text-slate-50">
                가격과 평균선
              </h3>
              <p className="mt-3 break-keep text-sm leading-7 text-slate-600 dark:text-slate-300">
                {buildMovingAverageCopy(technical)} 현재 5일선은{" "}
                {formatMetric(technical.sma5, formatPrice)}, 20일선은{" "}
                {formatMetric(technical.sma20, formatPrice)}, 60일선은{" "}
                {formatMetric(technical.sma60, formatPrice)}입니다.
              </p>
            </article>

            <article>
              <h3 className="text-base font-black text-slate-950 dark:text-slate-50">
                모멘텀과 변동성
              </h3>
              <p className="mt-3 break-keep text-sm leading-7 text-slate-600 dark:text-slate-300">
                {buildMomentumCopy(technical)} 최근 지지선은{" "}
                {formatMetric(technical.support, formatPrice)}, 저항선은{" "}
                {formatMetric(technical.resistance, formatPrice)}로 계산됩니다.
              </p>
            </article>

            <article>
              <h3 className="text-base font-black text-slate-950 dark:text-slate-50">
                핵심 근거와 주의 포인트
              </h3>
              <div className="mt-3 grid gap-4 md:grid-cols-2">
                <ul className="space-y-2 text-sm leading-6 text-slate-700 dark:text-slate-200">
                  {(reasons.length ? reasons : ["현재 확인 가능한 상승 근거가 제한적입니다."]).map((reason) => (
                    <li key={reason} className="break-keep">
                      {reason}
                    </li>
                  ))}
                </ul>
                <ul className="space-y-2 text-sm leading-6 text-slate-700 dark:text-slate-200">
                  {(risks.length ? risks : ["현재 표시할 큰 위험 신호는 제한적이지만, 장중 변동성은 계속 확인해야 합니다."]).map((risk) => (
                    <li key={risk} className="break-keep">
                      {risk}
                    </li>
                  ))}
                </ul>
              </div>
            </article>

            <article>
              <h3 className="text-base font-black text-slate-950 dark:text-slate-50">
                기업·업종 맥락
              </h3>
              <p className="mt-3 break-keep text-sm leading-7 text-slate-600 dark:text-slate-300">
                {companyContext.sector} 관점에서 보면 {companyContext.businessSummary}{" "}
                {companyContext.industryFlow} {companyContext.marketPosition}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  className="inline-flex rounded-full border border-slate-200/80 px-3 py-1.5 text-xs font-semibold text-[var(--brand-strong)] transition-colors hover:bg-[var(--surface-card)] dark:border-white/10 dark:hover:bg-white/[0.04]"
                  href="/guide/signal-score-methodology"
                >
                  점수 계산 방식
                </Link>
                <Link
                  className="inline-flex rounded-full border border-slate-200/80 px-3 py-1.5 text-xs font-semibold text-[var(--brand-strong)] transition-colors hover:bg-[var(--surface-card)] dark:border-white/10 dark:hover:bg-white/[0.04]"
                  href="/guide/volume-and-supply"
                >
                  수급 해석 기준
                </Link>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
