import Link from "next/link";

import {
  formatCompanyContextBrief,
  formatCompanyContextHeadline,
  inferCompanyContext,
} from "@/lib/analysis/company-context";
import type { StockLookupItem, TechnicalResponse } from "@/lib/types";
import { formatPercent, formatPrice, getBiasLabel } from "@/lib/utils";

function getSignalLead(stock: StockLookupItem, technicalPayload: TechnicalResponse | null) {
  if (!technicalPayload) {
    return `${stock.name}의 상세 차트 데이터가 준비되지 않았습니다. 기본 종목 정보와 업종 맥락을 먼저 확인한 뒤, 실시간 차트와 지표가 다시 열리면 가격 흐름과 거래량을 함께 보는 편이 좋습니다.`;
  }

  const { quote, signal, technical } = technicalPayload;
  const shortTrend =
    technical.currentPrice && technical.sma20
      ? technical.currentPrice >= technical.sma20
        ? "20일 평균 위에서 움직이고"
        : "20일 평균 아래에서 움직이고"
      : "중기 평균과의 거리 확인이 필요하고";

  return `${stock.name}는 현재 ${formatPrice(quote.currentPrice)}에 거래되고 있으며 전일 대비 ${formatPercent(quote.changePercent)} 흐름입니다. Charto 기준 추천 점수는 ${signal.score}점, 해석은 ${getBiasLabel(signal.bias)}이며 ${shortTrend} RSI와 MACD, 거래량을 함께 봐야 신호의 힘을 더 정확하게 읽을 수 있습니다.`;
}

function getActionGuide(stock: StockLookupItem, technicalPayload: TechnicalResponse | null) {
  if (!technicalPayload) {
    return `${stock.name} 페이지에서는 실시간 가격, 이동평균선, RSI, MACD, 볼린저 밴드, 지지선과 저항선을 한 화면에서 비교할 수 있습니다. 데이터가 다시 열리면 단기 가격 위치와 거래량부터 확인하는 것이 가장 빠릅니다.`;
  }

  const { technical, signal } = technicalPayload;
  const supportCopy = technical.support ? `지지선 후보는 ${formatPrice(technical.support)}` : "지지선은 아직 보수적으로 해석해야 하고";
  const resistanceCopy = technical.resistance
    ? `저항선 후보는 ${formatPrice(technical.resistance)}`
    : "저항선은 아직 명확하지 않습니다";

  return `${stock.name}를 볼 때는 ${supportCopy}, ${resistanceCopy}. 현재 점수 ${signal.score}점은 단기 기술 신호를 숫자로 압축한 값이므로, 점수 자체보다 어떤 이유가 점수를 끌어올렸는지와 어떤 위험 요인이 남아 있는지를 같이 읽는 편이 좋습니다.`;
}

export function AnalysisPageArticle({
  stock,
  technicalPayload,
}: {
  stock: StockLookupItem;
  technicalPayload: TechnicalResponse | null;
}) {
  const companyContext = technicalPayload?.companyContext ?? inferCompanyContext(stock);
  const signal = technicalPayload?.signal ?? null;
  const earningsContext = technicalPayload?.earningsContext ?? null;

  return (
    <section className="border-t border-slate-200/70 px-5 py-10 dark:border-white/10 md:px-8 md:py-14">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-3xl">
          <div className="text-[11px] font-black tracking-[0.12em] text-[var(--brand-strong)]">
            공개 분석 문서
          </div>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950 dark:text-slate-50 md:text-[2rem]">
            {stock.name} 차트 해석 요약
          </h2>
          <p className="mt-4 break-keep text-sm leading-7 text-slate-600 dark:text-slate-300 md:text-[15px]">
            {getSignalLead(stock, technicalPayload)}
          </p>
          <p className="mt-4 break-keep text-sm leading-7 text-slate-600 dark:text-slate-300 md:text-[15px]">
            {getActionGuide(stock, technicalPayload)}
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <article className="rounded-[8px] border border-slate-200/80 px-4 py-4 dark:border-white/10">
            <h3 className="text-base font-black text-slate-950 dark:text-slate-50">기술적 신호 해석</h3>
            <p className="mt-3 break-keep text-sm leading-7 text-slate-600 dark:text-slate-300">
              Charto는 이동평균선, RSI, MACD, 볼린저 밴드, 거래량, 지지선과 저항선을 함께 보고 단기
              흐름을 요약합니다. 한 가지 지표만으로 결론을 내리지 않고 서로 충돌하는 신호를 같이 보여
              주는 방식이라, 상승 우위와 위험 요인을 같은 화면에서 비교할 수 있습니다.
            </p>
            <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-700 dark:text-slate-200">
              {(signal?.reasons.length
                ? signal.reasons
                : ["상승 우위로 단정하기 전에 주요 지표 업데이트를 기다리는 편이 좋습니다."]).map((reason, index) => (
                <li key={`reason-${index}`} className="break-keep">
                  <strong className="text-slate-950 dark:text-slate-50">긍정 신호 {index + 1}.</strong> {reason}
                </li>
              ))}
              {(signal?.risks.length
                ? signal.risks
                : ["가격과 거래량, 수급이 함께 맞아떨어지는지 추가 확인이 필요합니다."]).map((risk, index) => (
                <li key={`risk-${index}`} className="break-keep">
                  <strong className="text-slate-950 dark:text-slate-50">점검 포인트 {index + 1}.</strong> {risk}
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-[8px] border border-slate-200/80 px-4 py-4 dark:border-white/10">
            <h3 className="text-base font-black text-slate-950 dark:text-slate-50">기업과 업종 맥락</h3>
            <p className="mt-3 text-sm font-semibold text-[var(--brand-strong)]">
              {formatCompanyContextHeadline(companyContext)}
            </p>
            <p className="mt-3 break-keep text-sm leading-7 text-slate-600 dark:text-slate-300">
              {formatCompanyContextBrief(companyContext)}
            </p>
            <p className="mt-3 break-keep text-sm leading-7 text-slate-600 dark:text-slate-300">
              {companyContext.industryFlow}
            </p>
            <p className="mt-3 break-keep text-sm leading-7 text-slate-600 dark:text-slate-300">
              {companyContext.marketPosition}
            </p>
            {companyContext.cautionNote ? (
              <p className="mt-3 break-keep text-sm leading-7 text-amber-700 dark:text-amber-200">
                해석 주의: {companyContext.cautionNote}
              </p>
            ) : null}
          </article>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <article className="rounded-[8px] border border-slate-200/80 px-4 py-4 dark:border-white/10">
            <h3 className="text-base font-black text-slate-950 dark:text-slate-50">최근 공시와 체크 포인트</h3>
            <p className="mt-3 break-keep text-sm leading-7 text-slate-600 dark:text-slate-300">
              {earningsContext?.available
                ? earningsContext.summary
                : `${stock.name}에 대해 최근 실적 또는 IR 공시 요약이 확보되지 않았습니다. 이 경우에는 차트 신호와 업종 흐름만으로 과하게 해석하지 말고, 다음 공시 일정과 실적 발표 시점을 함께 보는 편이 좋습니다.`}
            </p>
            <p className="mt-3 break-keep text-sm leading-7 text-slate-600 dark:text-slate-300">
              {earningsContext?.available
                ? earningsContext.outlook
                : "단기 가격 움직임이 강해도 다음 실적과 가이던스가 확인되기 전에는 기대감만으로 추세를 길게 보는 접근을 피하는 편이 좋습니다."}
            </p>
          </article>

          <article className="rounded-[8px] border border-slate-200/80 px-4 py-4 dark:border-white/10">
            <h3 className="text-base font-black text-slate-950 dark:text-slate-50">Charto 활용 방법</h3>
            <ol className="mt-3 space-y-2 text-sm leading-6 text-slate-700 dark:text-slate-200">
              <li>1. 현재가와 5일선, 20일선 위치를 먼저 확인합니다.</li>
              <li>2. RSI와 MACD가 같은 방향을 가리키는지 봅니다.</li>
              <li>3. 거래량과 외인·기관 수급이 차트 움직임을 뒷받침하는지 확인합니다.</li>
              <li>4. 실적, 업종 사이클, 공시 일정까지 붙여서 해석합니다.</li>
            </ol>
            <p className="mt-4 break-keep text-sm leading-7 text-slate-600 dark:text-slate-300">
              더 자세한 기준은 <Link className="font-semibold text-[var(--brand-strong)] hover:underline" href="/methodology">방법론</Link>과{" "}
              <Link className="font-semibold text-[var(--brand-strong)] hover:underline" href="/indicators">지표 해설</Link>에서
              정리했습니다.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
