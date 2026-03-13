"use client";

import { type CSSProperties, type ReactNode, useEffect, useReducer, useRef, useState } from "react";
import Link from "next/link";
import { IconHome2, IconSparkles } from "@tabler/icons-react";
import { createPortal } from "react-dom";

import { AnimatedLoadingStage } from "@/components/animated-loading-stage";
import { AuthActions } from "@/components/auth-actions";
import {
  formatCompanyContextBrief,
  formatCompanyContextHeadline,
  inferCompanyContext,
} from "@/lib/analysis/company-context";
import { getCompanyContextVisuals } from "@/lib/company-context-visuals";
import { StockChart } from "@/components/stock-chart";
import { StockSearch } from "@/components/stock-search";
import { StockAvatar } from "@/components/stock-avatar";
import type {
  AiSummary,
  SignalSummary,
  StockLookupItem,
  TechnicalResponse,
} from "@/lib/types";
import {
  clamp,
  formatInteger,
  formatPercent,
  formatPrice,
  formatSignedPrice,
} from "@/lib/utils";

const DEFAULT_INTERVAL = "1d";
const DEFAULT_RANGE = "max";
const RECOMMENDATION_INTERVAL = "1d";
const RECOMMENDATION_RANGE = "1y";

interface AnalysisPageClientProps {
  aiProviders: Array<{ id: "google" | "kakao"; name: string }>;
  aiUserName?: string | null;
  isAiUserSignedIn: boolean;
  featured: StockLookupItem[];
  stock: StockLookupItem;
  initialTechnicalPayload: TechnicalResponse | null;
  initialRecommendationSignal: SignalSummary | null;
  initialError: string | null;
  shouldAutoFetchAi: boolean;
}

async function fetchJson<T>(input: RequestInfo, init?: RequestInit) {
  const response = await fetch(input, init);
  const responseText = await response.text();
  let payload: unknown = null;

  if (responseText) {
    try {
      payload = JSON.parse(responseText);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const errorMessage =
      payload &&
      typeof payload === "object" &&
      "error" in payload &&
      typeof payload.error === "string"
        ? payload.error
        : `서버 응답을 확인해 주세요. (${response.status})`;

    throw new Error(errorMessage);
  }

  if (!payload) {
    throw new Error("서버 응답을 해석하지 못했습니다.");
  }

  return payload as T;
}

type MetricTone = "positive" | "neutral" | "warning" | "negative";

const SIGNAL_HIGHLIGHT_RULES = [
  {
    terms: [
      "20일선 위",
      "단기 추세가 강합니다",
      "5일선이 20일선 위",
      "최근 매수 흐름이 우위입니다",
      "RSI가 55~68 구간",
      "모멘텀이 유지되고 있습니다",
      "MACD 히스토그램이 플러스",
      "상승 탄력이 이어지고 있습니다",
      "거래량이 급증",
      "추세 신뢰도가 높습니다",
      "볼린저 상단권",
      "강한 추세 구간",
      "지지선 부근",
      "반등 시도 구간",
      "상단 유지",
      "모멘텀 우위",
      "지지 확보",
      "수급 강세",
      "우호적",
      "플러스",
      "강한 편",
    ],
    className:
      "font-extrabold text-[var(--positive-text)]",
  },
  {
    terms: [
      "20일선 아래",
      "단기 추세는 아직 약합니다",
      "5일선이 20일선 아래",
      "최근 매수 흐름은 아직 약합니다",
      "MACD 히스토그램이 마이너스",
      "단기 모멘텀이 둔화된 상태입니다",
      "변동성 리스크",
      "볼린저 하단권",
      "약세 압력",
      "저항선 근처",
      "되돌림",
      "이탈 경계",
      "회복이 필요",
      "약세권",
      "눌림 가능성",
      "매물 압력",
      "둔화",
      "마이너스",
      "하락",
    ],
    className:
      "font-bold text-rose-700 dark:text-rose-200",
  },
  {
    terms: ["과열권", "저항 인접", "주의", "관망", "경계"],
    className:
      "font-bold text-amber-800 dark:text-amber-200",
  },
] as const;

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getSignalSentenceTone(text: string): MetricTone {
  if (/둔화|마이너스|하락|약세|리스크|이탈|눌림|매물 압력|되돌림|약합니다|주의가 필요/.test(text)) {
    return "negative";
  }

  if (/과열권|경계|주의|관망|저항/.test(text)) {
    return "warning";
  }

  if (/강합니다|유지되고 있습니다|우위|플러스|상단권|지지|반등|신뢰도 높/.test(text)) {
    return "positive";
  }

  return "neutral";
}

function renderSignalCopy(text: string) {
  const matches = SIGNAL_HIGHLIGHT_RULES.flatMap((rule) =>
    rule.terms.flatMap((term) =>
      [...text.matchAll(new RegExp(escapeRegExp(term), "g"))].map((match) => ({
        start: match.index ?? 0,
        end: (match.index ?? 0) + term.length,
        className: rule.className,
      })),
    ),
  )
    .sort((left, right) => {
      if (left.start !== right.start) {
        return left.start - right.start;
      }

      return right.end - left.end;
    })
    .filter((match, index, list) => {
      const previous = list[index - 1];
      return !previous || match.start >= previous.end;
    });

  if (!matches.length) {
    return text;
  }

  const fragments: ReactNode[] = [];
  let cursor = 0;

  matches.forEach((match, index) => {
    if (cursor < match.start) {
      fragments.push(<span key={`plain-${index}-${cursor}`}>{text.slice(cursor, match.start)}</span>);
    }

    fragments.push(
      <span key={`hl-${index}-${match.start}`} className={match.className}>
        {text.slice(match.start, match.end)}
      </span>,
    );
    cursor = match.end;
  });

  if (cursor < text.length) {
    fragments.push(<span key={`tail-${cursor}`}>{text.slice(cursor)}</span>);
  }

  return fragments;
}

function SignalTextItem({ text, className = "" }: { text: string; className?: string }) {
  const tone = getSignalSentenceTone(text);
  const toneClass =
    tone === "positive"
      ? "text-[var(--positive-text)]"
      : tone === "negative"
        ? "text-rose-700 dark:text-rose-200"
        : tone === "warning"
          ? "text-amber-700 dark:text-amber-200"
          : "text-slate-600 dark:text-slate-300";

  return <li className={`${toneClass} ${className}`.trim()}>• {renderSignalCopy(text)}</li>;
}

function getMetricToneClass(tone: MetricTone) {
  switch (tone) {
    case "positive":
      return "bg-[rgba(5,192,114,0.1)] text-[var(--positive-text)] shadow-[inset_0_1px_0_rgba(255,255,255,0.42)] dark:bg-[rgba(5,192,114,0.14)] dark:text-[var(--positive-text)]";
    case "warning":
      return "bg-[rgba(251,191,36,0.13)] text-amber-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.42)] dark:bg-[rgba(217,119,6,0.18)] dark:text-amber-100";
    case "negative":
      return "bg-[rgba(244,63,94,0.1)] text-rose-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.42)] dark:bg-[rgba(190,24,93,0.16)] dark:text-rose-100";
    default:
      return "bg-[rgba(228,235,245,0.94)] text-[#41546c] shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] dark:bg-[rgba(148,163,184,0.12)] dark:text-slate-100";
  }
}

function getAverageMetricState(currentPrice: number | null | undefined, average: number | null | undefined) {
  if (!currentPrice || !average) {
    return { tone: "neutral" as const, label: "데이터 대기" };
  }

  return currentPrice >= average
    ? { tone: "positive" as const, label: "상단 유지" }
    : { tone: "negative" as const, label: "하단 위치" };
}

function getReferenceCloseByDays(candles: TechnicalResponse["candles"], days: number) {
  if (!candles.length) {
    return null;
  }

  const latestTime = candles.at(-1)?.time ?? 0;
  const targetTime = latestTime - days * 86_400;

  for (let index = candles.length - 1; index >= 0; index -= 1) {
    const candle = candles[index];
    if (candle.time <= targetTime) {
      return candle.close;
    }
  }

  return candles[0]?.close ?? null;
}

function getReferenceCloseForYtd(candles: TechnicalResponse["candles"]) {
  if (!candles.length) {
    return null;
  }

  const latestDate = new Date((candles.at(-1)?.time ?? 0) * 1000);
  const startOfYear = Math.floor(Date.UTC(latestDate.getUTCFullYear(), 0, 1) / 1000);

  const firstThisYear = candles.find((candle) => candle.time >= startOfYear);
  return firstThisYear?.close ?? candles[0]?.close ?? null;
}

function getReturnValue(currentPrice: number | null | undefined, referencePrice: number | null) {
  if (!currentPrice || !referencePrice || referencePrice === 0) {
    return null;
  }

  return ((currentPrice - referencePrice) / referencePrice) * 100;
}

function PerformanceChip({ label, value }: { label: string; value: number | null }) {
  const tone =
    value === null ? "neutral" : value > 0 ? "positive" : value < 0 ? "negative" : "neutral";
  const toneClass = getQuoteTextToneClass(tone);

  return (
    <div className="surface-card rounded-[8px] px-1.5 py-1.25 md:rounded-[14px] md:px-2.5 md:py-2.25">
      <div className="text-[8px] font-semibold tracking-[0.04em] text-slate-500 dark:text-slate-400 md:text-[10px]">
        {label}
      </div>
      <div className={`mt-0.75 text-[12px] font-extrabold tabular-nums md:mt-1 md:text-[15px] ${toneClass}`}>
        {value === null ? "-" : formatPercent(value)}
      </div>
    </div>
  );
}

function getRsiMetricState(rsi: number | null | undefined) {
  if (rsi === null || rsi === undefined) {
    return { tone: "neutral" as const, label: "데이터 대기" };
  }

  if (rsi >= 70) {
    return { tone: "warning" as const, label: "과열권" };
  }

  if (rsi <= 35) {
    return { tone: "negative" as const, label: "과매도권" };
  }

  if (rsi >= 55) {
    return { tone: "positive" as const, label: "모멘텀 우위" };
  }

  return { tone: "neutral" as const, label: "중립 구간" };
}

function getVolumeMetricState(volumeStatus: string | null | undefined) {
  switch (volumeStatus) {
    case "거래량 급증":
      return { tone: "positive" as const, label: "수급 강세" };
    case "거래량 둔화":
      return { tone: "negative" as const, label: "수급 둔화" };
    case "보통":
      return { tone: "neutral" as const, label: "평균 수준" };
    default:
      return { tone: "neutral" as const, label: "데이터 대기" };
  }
}

function getLevelMetricState(currentPrice: number | null | undefined, level: number | null | undefined, kind: "support" | "resistance") {
  if (!currentPrice || !level) {
    return { tone: "neutral" as const, label: "데이터 대기" };
  }

  const gapRatio = Math.abs(currentPrice - level) / level;
  if (kind === "support") {
    if (currentPrice < level) {
      return { tone: "negative" as const, label: "이탈 경계" };
    }

    return gapRatio <= 0.02
      ? { tone: "positive" as const, label: "지지 인접" }
      : { tone: "neutral" as const, label: "지지 확보" };
  }

  if (currentPrice > level) {
    return { tone: "positive" as const, label: "돌파 시도" };
  }

  return gapRatio <= 0.02
    ? { tone: "warning" as const, label: "저항 인접" }
    : { tone: "neutral" as const, label: "상단 여유" };
}

function MetricCard({
  label,
  value,
  hint,
  tone = "neutral",
  statusLabel,
  compact = false,
}: {
  label: string;
  value: string;
  hint: string;
  tone?: MetricTone;
  statusLabel?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`min-w-0 rounded-[14px] ${compact ? "p-2" : "p-2.5"} ${getMetricToneClass(
        tone,
      )} md:rounded-[16px] md:p-3`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className={`${compact ? "text-[10px]" : "text-[11px]"} font-semibold text-slate-500 dark:text-slate-300`}>
          {label}
        </div>
        {statusLabel ? (
          <div className="inline-flex shrink-0 whitespace-nowrap rounded-full border border-current/20 bg-white/95 px-1.5 py-0.5 text-[9px] font-bold tracking-[0.03em] text-current dark:bg-white/8">
            {statusLabel}
          </div>
        ) : null}
      </div>
      <div
        className={`mt-2 break-keep font-bold tracking-tight text-slate-950 tabular-nums dark:text-slate-50 ${
          compact ? "text-[14px] md:text-[17px]" : "text-[15px] md:text-[19px]"
        }`}
      >
        {value}
      </div>
      <div
        className={`mt-2 break-keep text-slate-500 dark:text-slate-300 ${
          compact ? "hidden text-[10px] leading-4 md:block" : "text-[11px] leading-4.5"
        }`}
      >
        {hint}
      </div>
    </div>
  );
}

function getMetricTextToneClass(tone: MetricTone, emphasized: boolean) {
  switch (tone) {
    case "positive":
      return emphasized ? "text-[var(--positive-text)]" : "text-[var(--positive-text)]";
    case "negative":
      return "text-[var(--price-down)]";
    case "warning":
      return emphasized ? "text-amber-700 dark:text-amber-200" : "text-amber-600 dark:text-amber-300";
    default:
      return emphasized ? "text-slate-900 dark:text-slate-50" : "text-slate-500 dark:text-slate-300";
  }
}

function getQuoteTextToneClass(tone: MetricTone) {
  switch (tone) {
    case "positive":
      return "text-[var(--price-up)]";
    case "negative":
      return "text-[var(--price-down)]";
    default:
      return "text-slate-500 dark:text-slate-300";
  }
}

function getQuoteTone(change: number | null | undefined): MetricTone {
  if (!change) {
    return "neutral";
  }

  return change > 0 ? "positive" : "negative";
}

function getSignalBiasMeta(bias: SignalSummary["bias"] | undefined) {
  switch (bias) {
    case "bullish":
      return {
        label: "차트 우호적",
        className:
          "bg-[rgba(5,192,114,0.12)] text-[var(--positive-text)] shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] dark:bg-[rgba(5,192,114,0.14)] dark:text-[var(--positive-text)]",
      };
    case "bearish":
      return {
        label: "차트 주의",
        className:
          "bg-[rgba(244,63,94,0.1)] text-rose-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] dark:bg-[rgba(190,24,93,0.16)] dark:text-rose-100",
      };
    default:
      return {
        label: "차트 중립",
        className:
          "bg-[rgba(220,229,241,0.92)] text-[#40546f] shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] dark:bg-[rgba(148,163,184,0.14)] dark:text-slate-100",
      };
  }
}

function getRecommendationMeta(score: number) {
  if (score >= 60) {
      return {
        label: "강력 추천",
        cardClassName:
          "bg-[rgba(5,192,114,0.12)] shadow-[inset_0_1px_0_rgba(255,255,255,0.44)] dark:bg-[rgba(5,192,114,0.16)]",
        badgeClassName:
          "border border-[rgba(5,192,114,0.36)] bg-[var(--positive-text)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.22)] dark:border-[rgba(5,192,114,0.28)] dark:bg-[rgba(5,192,114,0.22)] dark:text-[var(--positive-text)]",
      scoreClassName: "text-[var(--positive-text)]",
    };
  }

  if (score >= 30) {
      return {
        label: "추천",
        cardClassName:
          "bg-[rgba(5,192,114,0.08)] shadow-[inset_0_1px_0_rgba(255,255,255,0.44)] dark:bg-[rgba(5,192,114,0.12)]",
        badgeClassName:
          "border border-[rgba(5,192,114,0.26)] bg-[rgba(5,192,114,0.14)] text-[var(--positive-text)] shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] dark:border-[rgba(5,192,114,0.24)] dark:bg-[rgba(5,192,114,0.18)] dark:text-[var(--positive-text)]",
      scoreClassName: "text-[var(--positive-text)]",
    };
  }

  if (score <= -60) {
      return {
        label: "주의",
        cardClassName:
          "bg-[rgba(244,63,94,0.12)] shadow-[inset_0_1px_0_rgba(255,255,255,0.44)] dark:bg-[rgba(190,24,93,0.18)]",
        badgeClassName:
          "border border-rose-200 bg-rose-100 text-rose-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.48)] dark:border-rose-400/30 dark:bg-rose-500/18 dark:text-rose-200",
      scoreClassName: "text-rose-700 dark:text-rose-200",
    };
  }

  if (score <= -30) {
      return {
        label: "관망",
        cardClassName:
          "bg-[rgba(251,191,36,0.12)] shadow-[inset_0_1px_0_rgba(255,255,255,0.44)] dark:bg-[rgba(217,119,6,0.18)]",
        badgeClassName:
          "border border-amber-200 bg-amber-100 text-amber-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.48)] dark:border-amber-400/30 dark:bg-amber-500/16 dark:text-amber-200",
      scoreClassName: "text-amber-700 dark:text-amber-200",
    };
  }

  return {
    label: "중립",
    cardClassName:
      "bg-[rgba(220,229,241,0.94)] shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] dark:bg-[rgba(148,163,184,0.14)]",
    badgeClassName:
      "border border-[rgba(91,112,141,0.28)] bg-[rgba(205,218,235,0.98)] text-[#31465f] shadow-[inset_0_1px_0_rgba(255,255,255,0.56)] dark:border-[rgba(148,163,184,0.28)] dark:bg-[rgba(148,163,184,0.2)] dark:text-slate-100",
    scoreClassName: "text-[#304566] dark:text-slate-50",
  };
}

function getScoreDescriptor(score: number) {
  if (score >= 60) {
    return "강력 매수권";
  }

  if (score >= 30) {
    return "매수 우위";
  }

  if (score <= -60) {
    return "강력 매도권";
  }

  if (score <= -30) {
    return "매도 우위";
  }

  return "중립권";
}

function getScoreMarkerClass(score: number) {
  if (score >= 30) {
    return "bg-[#05C072]";
  }

  if (score <= -30) {
    return "bg-[var(--price-up)]";
  }

  return "bg-[#5b708d]";
}

function PrimaryQuoteCard({
  price,
  detail,
  detailTone = "neutral",
  className,
}: {
  price: string;
  detail?: string;
  detailTone?: MetricTone;
  className?: string;
}) {
  const detailToneClass = getQuoteTextToneClass(detailTone);

  return (
    <div className={`surface-card-strong rounded-[10px] px-2.5 py-2 md:rounded-[16px] md:px-3.5 md:py-3 ${className ?? ""}`}>
      <div className="text-[9px] font-semibold tracking-[0.08em] text-slate-500 dark:text-slate-300 md:text-[10px]">현재가</div>
      <div className="mt-1 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="break-keep text-[14px] font-extrabold tracking-tight text-slate-950 tabular-nums dark:text-slate-50 md:text-[20px]">
            {price}
          </div>
          {detail ? (
            <div className={`mt-0.5 break-keep text-[9px] font-semibold tabular-nums md:text-[11px] ${detailToneClass}`}>
              {detail}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function RecommendationCard({
  recommendation,
  score,
  signal,
  comparisonLabel,
  className,
}: {
  recommendation: {
    label: string;
    cardClassName: string;
    badgeClassName: string;
    scoreClassName: string;
  };
  score: number;
  signal: SignalSummary;
  comparisonLabel: string;
  className?: string;
}) {
  const [pinnedOpen, setPinnedOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState<CSSProperties | null>(null);
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const explanationItems = [
    ...signal.reasons.slice(0, 2),
    ...signal.risks.slice(0, 1),
  ].slice(0, 3);
  const open = hovered || pinnedOpen;
  const scoreDelta = signal.scoreDelta ?? null;
  const scoreDeltaTone =
    scoreDelta === null || scoreDelta === 0
      ? "neutral"
      : scoreDelta > 0
        ? "positive"
        : "negative";
  const scoreDeltaToneClass =
    scoreDeltaTone === "negative"
      ? "text-rose-700 dark:text-rose-200"
      : getMetricTextToneClass(scoreDeltaTone, false);
  const scoreDeltaText =
    scoreDelta === null
      ? null
      : `${comparisonLabel} ${scoreDelta > 0 ? "+" : ""}${scoreDelta}점`;
  const scorePosition = clamp(((score + 100) / 200) * 100, 0, 100);
  const scoreDescriptor = getScoreDescriptor(score);

  const supportsHover = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  useEffect(() => {
    if (!open || !triggerRef.current || typeof window === "undefined") {
      return;
    }

    const updatePosition = () => {
      if (!triggerRef.current) {
        return;
      }

      const rect = triggerRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const tooltipWidth = Math.min(280, viewportWidth - 32);
      const left = Math.max(16, Math.min(rect.right - tooltipWidth, viewportWidth - tooltipWidth - 16));

      setTooltipStyle({
        position: "fixed",
        top: rect.bottom + 8,
        left,
        width: tooltipWidth,
        zIndex: 200,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  return (
    <div
      className={`relative z-20 min-w-0 rounded-[10px] px-2.5 py-2 ${recommendation.cardClassName} md:rounded-[16px] md:px-3.5 md:py-3 ${className ?? ""}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="text-[9px] font-semibold tracking-[0.08em] text-slate-500 dark:text-slate-300 md:text-[10px]">
          추천 점수
        </div>
        <div className={`shrink-0 rounded-[9px] px-2 py-0.75 text-right ${recommendation.badgeClassName}`}>
          <div className="text-[10px] font-semibold md:text-[11px]">{recommendation.label}</div>
        </div>
      </div>
      <div className="mt-1 flex items-end justify-between gap-3 pr-8 md:pr-10">
        <div className={`text-[1.12rem] font-extrabold tracking-tight tabular-nums md:text-[1.8rem] ${recommendation.scoreClassName}`}>
          {score}
        </div>
      </div>
      {scoreDeltaText ? (
        <div className={`mt-0.5 pr-8 text-[9px] font-semibold md:pr-10 md:text-[11px] ${scoreDeltaToneClass}`}>{scoreDeltaText}</div>
      ) : null}
      <div
          ref={triggerRef}
          className="absolute bottom-2 right-2 shrink-0 md:bottom-3 md:right-3"
          onMouseEnter={() => {
            if (supportsHover()) {
              setHovered(true);
            }
          }}
          onMouseLeave={() => {
            if (supportsHover()) {
              setHovered(false);
            }
          }}
        >
          <button
            aria-expanded={open}
            aria-label={open ? "추천 점수 설명 닫기" : "추천 점수 설명 보기"}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[rgba(73,178,255,0.18)] text-sky-700 shadow-[0_10px_24px_rgba(73,178,255,0.24)] ring-1 ring-[rgba(73,178,255,0.18)] transition-colors hover:bg-[rgba(73,178,255,0.28)] dark:bg-[rgba(73,178,255,0.2)] dark:text-sky-100 dark:shadow-[0_12px_26px_rgba(18,40,72,0.34)] dark:ring-[rgba(157,196,255,0.16)] dark:hover:bg-[rgba(73,178,255,0.3)] md:h-8 md:w-8"
            type="button"
            onClick={() => {
              setPinnedOpen((current) => !current);
            }}
            onBlur={() => {
              if (supportsHover()) {
                setPinnedOpen(false);
              }
            }}
          >
            <IconSparkles size={16} stroke={2.1} />
          </button>
          {open && tooltipStyle && typeof document !== "undefined"
            ? createPortal(
                <div
                  className="rounded-[14px] border border-[var(--brand-soft-strong)] bg-[var(--surface-card)] px-3 py-3 text-[11px] leading-5 text-slate-600 shadow-[0_22px_60px_rgba(15,23,42,0.16)] dark:border-white/10 dark:bg-[var(--surface-1)] dark:text-slate-300 dark:shadow-[0_24px_64px_rgba(2,6,23,0.42)]"
                  style={tooltipStyle}
                >
              <div className="mb-3 rounded-[14px] bg-[var(--surface-card-strong)] p-3 dark:bg-white/[0.04]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold tracking-[0.08em] text-slate-500 dark:text-slate-400">
                      추천 위치
                    </div>
                    <div className={`mt-1 text-sm font-bold ${recommendation.scoreClassName}`}>
                      {score}점 · {scoreDescriptor}
                    </div>
                  </div>
                  <div className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${recommendation.badgeClassName}`}>
                    {recommendation.label}
                  </div>
                </div>
                <div className="mt-3">
                  <div className="relative px-0.5 py-1">
                    <div className="flex h-2.5 overflow-hidden rounded-full bg-white/40 dark:bg-white/8">
                      <span className="h-full w-1/3 bg-[rgba(240,66,81,0.75)]" />
                      <span className="h-full w-1/3 bg-slate-300 dark:bg-slate-600" />
                      <span className="h-full w-1/3 bg-[rgba(5,192,114,0.75)]" />
                    </div>
                    <div
                      className={`absolute top-1/2 z-10 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_4px_12px_rgba(15,23,42,0.18)] ${getScoreMarkerClass(score)} dark:border-[var(--surface-3)] dark:shadow-[0_4px_14px_rgba(2,6,23,0.32)]`}
                      style={{ left: `${scorePosition}%` }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px] font-semibold">
                    <span className="text-[var(--price-up)]">강력 매도</span>
                    <span className="text-slate-500 dark:text-slate-400">중립</span>
                    <span className="text-[var(--positive-text)]">강력 매수</span>
                  </div>
                </div>
              </div>
              <p className="break-keep">
                5일선, 20일선, RSI, MACD, 거래량, 지지·저항 신호를 합산한 점수예요. 플러스 100점에 가까울수록 우호적이고 마이너스 100점에 가까울수록 보수적으로 봐요.
              </p>
              {explanationItems.length ? (
                <ul className="mt-2 space-y-1.5 break-keep">
                  {explanationItems.map((item) => (
                    <SignalTextItem key={item} text={item} />
                  ))}
                </ul>
              ) : null}
                </div>,
                document.body,
              )
            : null}
      </div>
    </div>
  );
}

function AiInsightCard({
  label,
  text,
  secondaryText,
  tone = "default",
}: {
  label: string;
  text: string;
  secondaryText?: string;
  tone?: "default" | "brand" | "risk";
}) {
  const toneClass =
    tone === "brand"
      ? "bg-[var(--surface-card)] shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] dark:bg-white/[0.05]"
      : tone === "risk"
        ? "bg-[var(--surface-card)] shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] dark:bg-white/[0.05]"
        : "bg-[var(--surface-card)] shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] dark:bg-white/[0.05]";

  const labelClass =
    tone === "brand"
      ? "bg-[rgba(var(--brand-rgb),0.12)] text-[var(--brand-strong)] dark:bg-[rgba(73,178,255,0.12)] dark:text-sky-100"
      : tone === "risk"
        ? "bg-amber-100 text-amber-800 dark:bg-amber-400/16 dark:text-amber-100"
        : "bg-[var(--brand-soft)] text-[var(--brand-strong)] dark:bg-white/[0.06] dark:text-slate-100";

  return (
    <div className={`rounded-[14px] p-2.5 ${toneClass} md:rounded-[16px] md:p-3`}>
      <div className={`inline-flex rounded-full px-2 py-0.75 text-[10px] font-bold tracking-[0.04em] ${labelClass}`}>
        {label}
      </div>
      <p className="mt-2 break-keep text-[13px] font-semibold leading-5 text-slate-800 dark:text-slate-100 md:text-sm">
        {text}
      </p>
      {secondaryText ? (
        <p className="mt-1 break-keep text-[13px] leading-5 text-slate-500 dark:text-slate-300">
          {secondaryText}
        </p>
      ) : null}
    </div>
  );
}

function AiLoadingCard() {
  return (
    <div className="ai-glow rounded-[18px] px-4 py-4 text-sm text-slate-600 shadow-[0_18px_42px_rgba(35,60,124,0.12)] dark:text-slate-200">
      <div className="ai-gradient-text text-xs font-semibold tracking-[0.12em]">
        AI 브리핑
      </div>
      <div className="mt-2 font-medium">차트와 기업 흐름을 짧게 정리하고 있습니다.</div>
    </div>
  );
}

function AnalyzeInitialLoading({ stock }: { stock: StockLookupItem }) {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-132px)] max-w-5xl items-center px-4 pb-12 pt-5 md:px-6 md:pt-8">
      <section className="glass-card w-full rounded-[24px] p-4 md:rounded-[28px] md:p-6">
        <AnimatedLoadingStage stock={stock} />
      </section>
    </main>
  );
}

function RefreshingBadge({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full bg-[rgba(var(--brand-rgb),0.14)] font-bold text-[var(--brand-strong)] shadow-[0_10px_24px_rgba(36,87,135,0.12)] dark:bg-[rgba(73,178,255,0.14)] dark:text-slate-50 ${
        compact ? "px-2 py-0.75 text-[10px]" : "px-2.5 py-1.25 text-[11px]"
      }`}
    >
      <span className="relative inline-flex h-2.5 w-2.5 shrink-0">
        <span className="absolute inset-0 animate-ping rounded-full bg-[var(--brand)] opacity-70" />
        <span className="relative h-2.5 w-2.5 rounded-full bg-[var(--brand)]" />
      </span>
      <span>차트 업데이트 중</span>
    </div>
  );
}

function getMetricBarValue(value: number | null | undefined, baseline: number | null | undefined) {
  if (!value || !baseline || baseline === 0) {
    return 50;
  }

  return clamp(50 + ((value - baseline) / baseline) * 280, 0, 100);
}

function getVolumeBarValue(volume: number | null | undefined, average: number | null | undefined) {
  if (!volume || !average || average === 0) {
    return 50;
  }

  return clamp((volume / average) * 45, 0, 100);
}

function getToneRailClasses(tone: MetricTone) {
  switch (tone) {
    case "positive":
      return {
        track: "bg-[rgba(5,192,114,0.12)] dark:bg-[rgba(5,192,114,0.16)]",
        fill: "bg-[var(--positive-text)]",
        text: "text-[var(--positive-text)]",
      };
    case "negative":
      return {
        track: "bg-[rgba(52,133,250,0.12)] dark:bg-[rgba(52,133,250,0.16)]",
        fill: "bg-[var(--price-down)]",
        text: "text-[var(--price-down)]",
      };
    case "warning":
      return {
        track: "bg-[rgba(251,191,36,0.14)] dark:bg-[rgba(251,191,36,0.18)]",
        fill: "bg-amber-500",
        text: "text-amber-700 dark:text-amber-200",
      };
    default:
      return {
        track: "bg-[var(--surface-card-strong)] dark:bg-white/[0.06]",
        fill: "bg-slate-400 dark:bg-slate-300",
        text: "text-slate-600 dark:text-slate-300",
      };
  }
}

function getShortTermFlowCopy(
  currentPrice: number | null | undefined,
  average: number | null | undefined,
) {
  if (!currentPrice || !average) {
    return "데이터 대기";
  }

  return currentPrice >= average ? "5일선 위" : "5일선 아래";
}

function getTrendFlowCopy(
  currentPrice: number | null | undefined,
  average: number | null | undefined,
) {
  if (!currentPrice || !average) {
    return "데이터 대기";
  }

  return currentPrice >= average ? "20일선 위" : "20일선 아래";
}

function getMomentumCopy(rsi: number | null | undefined) {
  if (rsi === null || rsi === undefined) {
    return "데이터 대기";
  }

  if (rsi >= 70) {
    return "과열 구간";
  }

  if (rsi <= 35) {
    return "과매도 구간";
  }

  if (rsi >= 55) {
    return "모멘텀 우위";
  }

  return "중립 구간";
}

function getVolumeFlowCopy(volumeStatus: string | null | undefined) {
  switch (volumeStatus) {
    case "거래량 급증":
      return "수급 강세";
    case "거래량 둔화":
      return "수급 둔화";
    case "보통":
      return "평균 수준";
    default:
      return "데이터 대기";
  }
}

function SignalRail({
  label,
  value,
  helper,
  percent,
  tone,
}: {
  label: string;
  value: string;
  helper: string;
  percent: number;
  tone: MetricTone;
}) {
  const rail = getToneRailClasses(tone);

  return (
    <div className="rounded-[10px] bg-[var(--surface-card)] px-2 py-1.75 dark:bg-white/[0.04] md:rounded-[16px] md:px-3 md:py-2.5">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[8px] font-semibold tracking-[0.08em] text-slate-500 dark:text-slate-400 md:text-[10px]">
          {label}
        </div>
        <div className={`text-[9px] font-semibold ${rail.text} md:text-[11px]`}>{value}</div>
      </div>
      <div className={`mt-2 h-1.5 overflow-hidden rounded-full ${rail.track}`}>
        <div className={`h-full rounded-full ${rail.fill}`} style={{ width: `${percent}%` }} />
      </div>
      <div className="mt-1 text-[8px] text-slate-500 dark:text-slate-400 md:mt-1.5 md:text-[11px]">{helper}</div>
    </div>
  );
}

function getAiUnavailableCopy(reason: string | undefined) {
  if (!reason) {
    return "AI 응답을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";
  }

  if (reason === "missing_api_key") {
    return "Vercel 또는 로컬 환경에 GEMINI_API_KEY 또는 GEMINI_API_KEYS를 설정하면 AI 브리핑이 활성화됩니다.";
  }

  if (reason === "auth_required") {
    return "로그인 기능 준비 중입니다. 현재 배포에서는 AI 브리핑 로그인을 아직 열어두지 않았습니다.";
  }

  const normalized = reason.toLowerCase();
  if (
    normalized.includes("quota") ||
    normalized.includes("rate limit") ||
    normalized.includes("429") ||
    normalized.includes("resource_exhausted")
  ) {
    return "Gemini 무료 호출 한도에 도달했습니다. 잠시 후 다시 시도해 주세요.";
  }

  if (normalized.includes("api key") || normalized.includes("permission")) {
    return "Gemini API 키 설정 또는 권한을 확인해 주세요.";
  }

  return "AI 브리핑 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
}

export function AnalysisPageClient({
  aiProviders,
  aiUserName,
  isAiUserSignedIn,
  featured,
  stock,
  initialTechnicalPayload,
  initialRecommendationSignal,
  initialError,
  shouldAutoFetchAi,
}: AnalysisPageClientProps) {
  const [technicalPayload, setTechnicalPayload] = useState<TechnicalResponse | null>(
    initialTechnicalPayload,
  );
  const [aiState, dispatchAi] = useReducer(
    (
      state: { loading: boolean; summary: AiSummary | null },
      action:
        | { type: "request"; preserveCurrent?: boolean }
        | { type: "resolved"; summary: AiSummary }
        | { type: "failed"; reason: string },
    ) => {
      switch (action.type) {
        case "request":
          return {
            loading: true,
            summary: action.preserveCurrent ? state.summary : null,
          };
        case "resolved":
          return { loading: false, summary: action.summary };
        case "failed":
          return {
            loading: false,
            summary: {
              available: false,
              reason: action.reason,
              disclaimer:
                "이 분석은 기술적 지표를 바탕으로 한 참고 정보이며 투자 판단의 책임은 사용자에게 있습니다.",
            },
          };
      }
    },
    { loading: false, summary: null },
  );
  const [error, setError] = useState<string | null>(initialError);
  const [recommendationTechnicalPayload, setRecommendationTechnicalPayload] =
    useState<TechnicalResponse | null>(null);
  const [recommendationSignal, setRecommendationSignal] = useState<SignalSummary | null>(
    initialRecommendationSignal,
  );
  const [aiRequested, setAiRequested] = useState(isAiUserSignedIn ? shouldAutoFetchAi : false);
  const [minIntroReady, setMinIntroReady] = useState(false);
  const [revealPhase, setRevealPhase] = useState(0);
  const skipInitialDataFetch = useRef(Boolean(initialTechnicalPayload && !initialError));

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setMinIntroReady(true);
    }, 4300);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (skipInitialDataFetch.current) {
      skipInitialDataFetch.current = false;
      return;
    }

    const controller = new AbortController();

    fetchJson<TechnicalResponse>(
      `/api/analysis/technical?symbol=${stock.symbol}&interval=${DEFAULT_INTERVAL}&range=${DEFAULT_RANGE}`,
      { signal: controller.signal },
    )
      .then((technical) => {
        setTechnicalPayload(technical);
        setError(null);
      })
      .catch((requestError) => {
        if ((requestError as Error).name === "AbortError") {
          return;
        }

        setError((requestError as Error).message);
      })

    return () => controller.abort();
  }, [stock.symbol]);

  useEffect(() => {
    if (!technicalPayload || !aiRequested) {
      return;
    }

    const controller = new AbortController();
    dispatchAi({ type: "request", preserveCurrent: true });

    fetchJson<AiSummary>("/api/analysis/summary", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        stock,
        technical: technicalPayload.technical,
        signal: technicalPayload.signal,
        companyContext: technicalPayload.companyContext,
      }),
      signal: controller.signal,
    })
      .then((payload) => {
        dispatchAi({ type: "resolved", summary: payload });
      })
      .catch((requestError) => {
        if ((requestError as Error).name === "AbortError") {
          return;
        }

        dispatchAi({ type: "failed", reason: (requestError as Error).message });
      });

    return () => controller.abort();
  }, [aiRequested, stock, technicalPayload]);

  useEffect(() => {
    const controller = new AbortController();

    fetchJson<TechnicalResponse>(
      `/api/analysis/technical?symbol=${stock.symbol}&interval=${RECOMMENDATION_INTERVAL}&range=${RECOMMENDATION_RANGE}`,
      { signal: controller.signal },
    )
      .then((payload) => {
        setRecommendationTechnicalPayload(payload);
        setRecommendationSignal(payload.signal);
      })
      .catch((requestError) => {
        if ((requestError as Error).name === "AbortError") {
          return;
        }
      });

    return () => controller.abort();
  }, [stock.symbol]);

  const candlesPayload = technicalPayload;
  const quote = candlesPayload?.quote ?? technicalPayload?.quote;
  const hasValidQuote = Boolean(quote && quote.currentPrice > 0);
  const signal = technicalPayload?.signal;
  const technical = technicalPayload?.technical;
  const chartUnavailable = Boolean(candlesPayload?.chartUnavailable);
  const isInitialLoading = !candlesPayload && !error;
  const currentSelectionKey = `${stock.symbol}:${DEFAULT_INTERVAL}:${DEFAULT_RANGE}`;
  const loadedSelectionKey = technicalPayload
    ? `${stock.symbol}:${technicalPayload.interval}:${technicalPayload.range}`
    : null;
  const isRefreshing = Boolean(technicalPayload) && currentSelectionKey !== loadedSelectionKey;

  useEffect(() => {
    if (isInitialLoading || !minIntroReady) {
      const resetTimer = window.setTimeout(() => {
        setRevealPhase(0);
      }, 0);

      return () => window.clearTimeout(resetTimer);
    }

    const schedule = [120, 320, 560, 820, 1120, 1460, 1820];
    const timers = schedule.map((delay, index) =>
      window.setTimeout(() => {
        setRevealPhase(index + 1);
      }, delay),
    );

    return () => {
      timers.forEach((timerId) => window.clearTimeout(timerId));
    };
  }, [stock.symbol, loadedSelectionKey, isInitialLoading, minIntroReady]);

  const aiSummary = aiState.summary;
  const isAiAuthAvailable = aiProviders.length > 0;
  const canUseAi = isAiAuthAvailable && isAiUserSignedIn;
  const sma5State = getAverageMetricState(technical?.currentPrice, technical?.sma5);
  const sma20State = getAverageMetricState(technical?.currentPrice, technical?.sma20);
  const rsiState = getRsiMetricState(technical?.rsi14);
  const volumeState = getVolumeMetricState(technical?.volumeStatus);
  const supportState = getLevelMetricState(technical?.currentPrice, technical?.support, "support");
  const resistanceState = getLevelMetricState(
    technical?.currentPrice,
    technical?.resistance,
    "resistance",
  );
  const quoteTone = getQuoteTone(quote?.change);
  const recommendation = recommendationSignal
    ? getRecommendationMeta(recommendationSignal.score)
    : null;
  const recommendationCurrentPrice = recommendationTechnicalPayload?.quote.currentPrice ?? null;
  const weeklyReturn = getReturnValue(
    recommendationCurrentPrice,
    getReferenceCloseByDays(recommendationTechnicalPayload?.candles ?? [], 7),
  );
  const monthlyReturn = getReturnValue(
    recommendationCurrentPrice,
    getReferenceCloseByDays(recommendationTechnicalPayload?.candles ?? [], 30),
  );
  const ytdReturn = getReturnValue(
    recommendationCurrentPrice,
    getReferenceCloseForYtd(recommendationTechnicalPayload?.candles ?? []),
  );
  const scoreComparisonLabel = "전일 대비";
  const visibleReasons = signal?.reasons.slice(0, 2) ?? [];
  const visibleRisks = signal?.risks.slice(0, 1) ?? [];
  const aiChartSummary = aiSummary?.trend ?? aiSummary?.momentum ?? "";
  const aiMomentumSummary =
    aiSummary?.trend && aiSummary?.momentum && aiSummary.trend !== aiSummary.momentum
      ? aiSummary.momentum
      : undefined;
  const companyContext = technicalPayload?.companyContext ?? inferCompanyContext(stock);
  const companyContextBrief = formatCompanyContextBrief(companyContext);
  const companyContextHeadline = formatCompanyContextHeadline(companyContext);
  const companyContextVisuals = getCompanyContextVisuals(stock, companyContext);
  const HeadlineIcon = companyContextVisuals.headlineIcon;
  const ContextSectorIcon = companyContextVisuals.SectorIcon;
  const companyContextSupport = aiSummary?.business || companyContext.industryFlow;
  const companyContextTags = [
    companyContext.instrumentLabel !== "개별 종목" ? companyContext.instrumentLabel : null,
    companyContext.group,
    companyContext.sector,
  ].filter(Boolean) as string[];
  const aiRiskSummary = aiSummary?.risk || companyContext.marketPosition;
  const signalBiasMeta = getSignalBiasMeta(signal?.bias);
  const headerSignalItems = [
    {
      label: "단기 흐름",
      value: getShortTermFlowCopy(technical?.currentPrice, technical?.sma5),
      helper: technical?.sma5 ? `5일 평균 ${formatPrice(technical.sma5)}` : "데이터 대기",
      percent: getMetricBarValue(technical?.currentPrice, technical?.sma5),
      tone: sma5State.tone,
    },
    {
      label: "추세 방향",
      value: getTrendFlowCopy(technical?.currentPrice, technical?.sma20),
      helper: technical?.sma20 ? `20일 평균 ${formatPrice(technical.sma20)}` : "데이터 대기",
      percent: getMetricBarValue(technical?.currentPrice, technical?.sma20),
      tone: sma20State.tone,
    },
    {
      label: "모멘텀",
      value: getMomentumCopy(technical?.rsi14),
      helper: technical?.rsi14 ? `RSI ${technical.rsi14.toFixed(2)}` : "데이터 대기",
      percent: clamp(technical?.rsi14 ?? 50, 0, 100),
      tone: rsiState.tone,
    },
    {
      label: "수급",
      value: getVolumeFlowCopy(technical?.volumeStatus),
      helper:
        technical?.volumeAverage20 && quote?.volume
          ? `평균 대비 ${Math.round((quote.volume / technical.volumeAverage20) * 100)}%`
          : "데이터 대기",
      percent: getVolumeBarValue(quote?.volume, technical?.volumeAverage20),
      tone: volumeState.tone,
    },
  ];
  const metricItems = [
    {
      label: "5일선",
      value: technical ? formatPrice(technical.sma5) : "-",
      hint: "최근 흐름을 가장 빠르게 보는 기준선",
      statusLabel: sma5State.label,
      tone: sma5State.tone,
      mobileHidden: false,
    },
    {
      label: "20일선",
      value: technical ? formatPrice(technical.sma20) : "-",
      hint: "단기 추세 방향을 확인하는 기준선",
      statusLabel: sma20State.label,
      tone: sma20State.tone,
      mobileHidden: false,
    },
    {
      label: "RSI(14)",
      value: technical?.rsi14?.toFixed(2) ?? "-",
      hint: "50 위면 모멘텀 우위, 70 이상은 과열 경계",
      statusLabel: rsiState.label,
      tone: rsiState.tone,
      mobileHidden: false,
    },
    {
      label: "거래량 상태",
      value: technical?.volumeStatus ?? "-",
      hint: `최근 평균 거래량 ${formatInteger(technical?.volumeAverage20 ?? null)}주`,
      statusLabel: volumeState.label,
      tone: volumeState.tone,
      mobileHidden: false,
    },
    {
      label: "지지선",
      value: technical ? formatPrice(technical.support) : "-",
      hint: "최근 저점 기준의 단순 지지선",
      statusLabel: supportState.label,
      tone: supportState.tone,
      mobileHidden: true,
    },
    {
      label: "저항선",
      value: technical ? formatPrice(technical.resistance) : "-",
      hint: "최근 고점 기준의 단순 저항선",
      statusLabel: resistanceState.label,
      tone: resistanceState.tone,
      mobileHidden: true,
    },
  ];

  if (isInitialLoading || !minIntroReady) {
    return <AnalyzeInitialLoading stock={stock} />;
  }

  return (
    <main className="mx-auto max-w-6xl px-3.5 pb-8 pt-3.5 md:px-6 md:pb-12 md:pt-5">
      <div
        key={`${stock.symbol}:${loadedSelectionKey ?? "ready"}`}
        className="flex flex-col gap-3.5 md:gap-4"
      >
        <div
          className={`waterfall-item flex items-center gap-2 md:gap-2.5 ${revealPhase >= 1 ? "is-visible" : ""}`}
        >
          <Link
            aria-label="홈으로 이동"
            className="brand-soft-hover inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] text-[var(--brand-strong)] dark:text-slate-100 md:h-10 md:w-10 md:rounded-[14px]"
            href="/"
          >
            <IconHome2 size={15} stroke={2} />
          </Link>
          <div className="min-w-0 flex-1">
            <StockSearch featured={featured} variant="inline" />
          </div>
        </div>

        <section
          className={`waterfall-item glass-card relative z-10 overflow-visible rounded-[14px] p-2 md:rounded-[22px] md:p-4 ${revealPhase >= 2 ? "is-visible" : ""}`}
        >
            <div
              className={`waterfall-item flex min-w-0 items-start gap-3 ${revealPhase >= 2 ? "is-visible" : ""}`}
              style={{ "--waterfall-delay": "120ms" } as CSSProperties}
            >
            <StockAvatar size="sm" stock={stock} />
            <div className="min-w-0 flex-1">
              <h1 className="mt-0.5 break-keep text-[1rem] font-extrabold tracking-tight text-slate-950 dark:text-slate-50 md:mt-1 md:text-[1.7rem]">
                {stock.name}
              </h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px] md:text-[12px]">
                <span className="inline-flex items-center rounded-full bg-[var(--surface-pill)] px-2 py-0.75 font-semibold text-slate-600 dark:bg-white/[0.06] dark:text-slate-200">
                  {stock.symbol}
                </span>
                <span className="inline-flex items-center rounded-full bg-[var(--surface-pill)] px-2 py-0.75 font-semibold text-slate-600 dark:bg-white/[0.06] dark:text-slate-200">
                  {stock.market}
                </span>
              </div>
            </div>
            </div>
              <div
                className={`waterfall-item mt-2 grid gap-2 xl:grid-cols-[minmax(0,1fr)_minmax(320px,344px)] xl:items-stretch ${revealPhase >= 3 ? "is-visible" : ""}`}
                style={{ "--waterfall-delay": "80ms" } as CSSProperties}
              >
            <div className="surface-card h-full rounded-[12px] p-2 md:rounded-[18px] md:p-3">
              <div className="flex items-start gap-3">
                <div
                  className="inline-flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-[10px] md:h-12 md:w-12 md:rounded-[14px]"
                  style={companyContextVisuals.headlineStyle as CSSProperties}
                >
                  <span
                    className="inline-flex h-6 w-6 items-center justify-center rounded-[8px] md:h-8 md:w-8 md:rounded-[10px]"
                    style={companyContextVisuals.headlineIconStyle}
                  >
                    <HeadlineIcon size={16} stroke={companyContextVisuals.sectorIconStroke} />
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[9px] font-semibold tracking-[0.12em] text-slate-500 dark:text-slate-400">
                        종목 정보
                      </div>
                      <p className="mt-1 break-keep text-[11px] font-bold leading-4 text-slate-900 dark:text-slate-50 md:text-[14px] md:leading-5">
                        {companyContextHeadline}
                      </p>
                    </div>
                     <div
                       className={`shrink-0 rounded-full px-2 py-0.75 text-[9px] font-semibold ${signalBiasMeta.className}`}
                     >
                      {signalBiasMeta.label}
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <div
                      className="inline-flex items-center gap-1 rounded-full px-1.75 py-0.5 text-[9px] font-semibold [background-color:var(--chip-bg)] [color:var(--chip-text)] shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] dark:[background-color:var(--chip-bg-dark)] dark:[color:var(--chip-text-dark)]"
                      style={companyContextVisuals.groupChipStyle as CSSProperties}
                    >
                      {companyContextVisuals.brandLabel}
                    </div>
                    <div
                      className="inline-flex items-center gap-1 rounded-full px-1.75 py-0.5 text-[9px] font-semibold [background-color:var(--chip-bg)] [color:var(--chip-text)] shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] dark:[background-color:var(--chip-bg-dark)] dark:[color:var(--chip-text-dark)]"
                      style={companyContextVisuals.sectorChipStyle as CSSProperties}
                    >
                      <span
                        className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full [background-color:var(--chip-icon-bg)] [color:var(--chip-icon-color)] dark:[background-color:var(--chip-icon-bg-dark)] dark:[color:var(--chip-icon-color-dark)]"
                        style={companyContextVisuals.sectorIconStyle as CSSProperties}
                      >
                        <ContextSectorIcon size={11} stroke={companyContextVisuals.sectorIconStroke} />
                      </span>
                      {companyContext.sector}
                    </div>
                  </div>
                  <p className="mt-1.5 break-keep text-[11px] leading-4.5 text-slate-500 dark:text-slate-300 md:text-[13px] md:leading-5.5">
                    {companyContextBrief}
                  </p>
                </div>
              </div>
            </div>
             <div className="grid min-w-0 grid-cols-2 auto-rows-fr gap-2.5">
              <PrimaryQuoteCard
                className="order-1 h-full"
                price={hasValidQuote && quote ? formatPrice(quote.currentPrice) : "-"}
                detail={
                  hasValidQuote && quote
                    ? `전일 대비 ${formatPercent(quote.changePercent)} (${formatSignedPrice(quote.change)})`
                    : undefined
                }
                detailTone={quoteTone}
              />
              {recommendationSignal && recommendation ? (
                <RecommendationCard
                  className="order-2 h-full"
                  recommendation={recommendation}
                  score={recommendationSignal.score}
                  signal={recommendationSignal}
                  comparisonLabel={scoreComparisonLabel}
                />
              ) : null}
              <div className="order-3 col-span-2 grid gap-1.5 sm:grid-cols-3 sm:gap-2">
                <PerformanceChip label="올해 수익률" value={ytdReturn} />
                <PerformanceChip label="최근 1개월" value={monthlyReturn} />
                <PerformanceChip label="최근 1주" value={weeklyReturn} />
              </div>
            </div>
              </div>
             <div
               className={`waterfall-item mt-2 surface-card rounded-[12px] p-2 md:mt-3 md:rounded-[18px] md:p-3 ${revealPhase >= 4 ? "is-visible" : ""}`}
               style={{ "--waterfall-delay": "120ms" } as CSSProperties}
             >
              <div className="text-[9px] font-semibold tracking-[0.12em] text-slate-500 dark:text-slate-400">
                기업 포인트
              </div>
              <p className="mt-1.5 break-keep text-[10px] leading-4 text-slate-600 dark:text-slate-300 md:text-[12px] md:leading-5">
                {companyContext.marketPosition}
              </p>
              {companyContext.cautionNote ? (
                <div className="mt-2 rounded-[12px] bg-[rgba(251,191,36,0.12)] px-2.5 py-2 text-[9px] font-medium leading-4 text-amber-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] dark:bg-[rgba(217,119,6,0.16)] dark:text-amber-100 md:px-3 md:text-[10px] md:leading-5">
                  {companyContext.cautionNote}
                </div>
              ) : null}
              <div className="mt-3">
                <div className="mb-2 text-[9px] font-semibold tracking-[0.12em] text-slate-500 dark:text-slate-400">
                  신호 보드
                </div>
                <div className="grid gap-1.5 sm:grid-cols-2 xl:grid-cols-4">
                  {headerSignalItems.map((item) => (
                    <SignalRail
                      key={item.label}
                      label={item.label}
                      value={item.value}
                      helper={item.helper}
                      percent={item.percent}
                      tone={item.tone}
                    />
                  ))}
                </div>
              </div>
              <div className="mt-2 rounded-[12px] bg-[var(--surface-card-strong)] px-2 py-2 dark:bg-white/[0.04]">
                <div className="text-[9px] font-semibold tracking-[0.12em] text-slate-500 dark:text-slate-400">
                  업종 포인트
                </div>
                <p className="mt-1 break-keep text-[11px] leading-4.5 text-slate-600 dark:text-slate-300">
                  {companyContext.industryFlow}
                </p>
              </div>
            </div>
          </section>

        {error ? (
          <section
            className={`waterfall-item glass-card rounded-[32px] p-8 text-center ${revealPhase >= 2 ? "is-visible" : ""}`}
          >
            <div className="text-lg font-semibold text-slate-900">데이터를 불러오지 못했습니다.</div>
            <p className="mt-2 break-keep text-sm text-slate-500">{error}</p>
            <button
              className="brand-button mt-5 rounded-full px-5 py-2.5 text-sm font-semibold"
              type="button"
              onClick={() => window.location.reload()}
            >
              다시 시도
            </button>
          </section>
        ) : null}

        <div className="grid gap-3.5 xl:grid-cols-[minmax(0,1.72fr)_minmax(280px,0.92fr)] xl:items-start">
            <section
              className={`waterfall-item glass-card self-start overflow-hidden rounded-[14px] p-2.5 md:rounded-[24px] md:p-4 ${revealPhase >= 5 ? "is-visible" : ""}`}
            >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h2 className="text-[15px] font-bold text-slate-950 dark:text-slate-50 md:text-[17px]">가격 차트</h2>
                <p className="mt-1 hidden break-keep text-xs leading-5 text-slate-500 dark:text-slate-300 md:block">
                  일봉 기준으로 전체 흐름을 확인할 수 있습니다.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="rounded-full bg-[var(--surface-pill)] px-1.75 py-0.5 text-[9px] font-semibold text-slate-600 dark:bg-white/[0.06] dark:text-slate-200">
                  일봉
                </div>
                <div className="rounded-full bg-slate-100 px-1.75 py-0.5 text-[9px] font-semibold text-slate-600 dark:bg-white/[0.06] dark:text-slate-200">
                  {candlesPayload?.provider === "demo" ? "Demo" : "KIS"}
                </div>
                {isRefreshing ? <RefreshingBadge compact /> : null}
              </div>
            </div>

            <div className="relative mt-2 max-w-full overflow-hidden rounded-[14px] bg-[var(--surface-3)] p-1 md:mt-3 md:rounded-[20px] md:p-2">
              {isRefreshing ? (
                <div className="pointer-events-none absolute right-3 top-3 z-10">
                  <RefreshingBadge />
                </div>
              ) : null}
              {candlesPayload?.candles.length ? (
                <StockChart candles={candlesPayload.candles} />
              ) : (
                <div
                  className={`flex h-[300px] flex-col items-center justify-center rounded-[18px] px-6 text-center md:h-[390px] ${
                    chartUnavailable
                      ? "bg-slate-100 text-slate-600 dark:bg-white/[0.05] dark:text-slate-200"
                      : "bg-slate-50 text-slate-400 dark:bg-[var(--surface-3)] dark:text-slate-400"
                  }`}
                >
                  <div className={`font-semibold ${chartUnavailable ? "text-sm md:text-base" : "text-sm"}`}>
                    {isInitialLoading
                      ? "차트 데이터를 불러오는 중..."
                      : chartUnavailable
                        ? "차트 미제공 종목입니다."
                        : "표시할 차트 데이터가 없습니다."}
                  </div>
                  {!isInitialLoading && chartUnavailable ? (
                    <div className="mt-2 max-w-[320px] text-xs leading-5 text-slate-500 dark:text-slate-300">
                      현재는 이 종목의 차트 데이터를 제공하지 않습니다. 현재가와 핵심 분석 정보는 계속 확인할 수 있습니다.
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {/* <div className="mt-2.5 grid gap-2">
              <div className="soft-panel rounded-[12px] p-1.5 md:rounded-[16px] md:p-2.5">
                <div className="mb-1.5 text-[9px] font-semibold tracking-[0.12em] text-slate-500">
                  표시 기준
                </div>
                <div className="rounded-[10px] border border-[var(--brand-soft-strong)] bg-[var(--brand-soft)] px-2.5 py-1.75 text-[10px] font-semibold text-[var(--brand-strong)] dark:border-white/10 dark:bg-white/6 dark:text-slate-100 md:rounded-[12px] md:py-2 md:text-[11px]">
                  일봉 기준 전체 기간 차트를 제공합니다.
                </div>
              </div>

              {notice ? (
                <div
                  className={`rounded-[12px] px-2.5 py-2 text-[10px] leading-4.5 md:rounded-[16px] md:px-3.5 md:py-3 md:text-sm ${
                    chartUnavailable
                      ? "bg-slate-100 text-slate-700 dark:bg-white/[0.05] dark:text-slate-200"
                      : "bg-amber-50 text-amber-800 dark:bg-amber-500/12 dark:text-amber-100"
                  }`}
                >
                  {notice}
                </div>
              ) : null}
            </div> */}
            </section>

            <div className="grid gap-3.5">
                <section
                  className={`waterfall-item glass-card overflow-hidden rounded-[14px] p-2.5 md:rounded-[24px] md:p-4 ${revealPhase >= 6 ? "is-visible" : ""}`}
                  style={{ "--waterfall-delay": "80ms" } as CSSProperties}
                >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h2 className="text-[15px] font-bold text-slate-950 dark:text-slate-50 md:text-[17px]">한눈에 보기</h2>
                  <p className="mt-1 hidden break-keep text-xs leading-5 text-slate-500 dark:text-slate-300 md:block">
                    차트 옆에서 핵심 신호와 지표를 바로 확인합니다.
                  </p>
                </div>
              </div>
              <div className="mt-2.5 space-y-2.5 md:mt-3 md:space-y-3">
                <div className="surface-card rounded-[12px] p-2 dark:bg-white/[0.04] md:rounded-[18px] md:p-3">
                  <div className="text-[13px] font-semibold text-slate-700 dark:text-slate-100">핵심 근거</div>
                  <ul className="mt-1.5 space-y-1.25 text-[11px] leading-4.5 text-slate-600 dark:text-slate-300 md:mt-2.5 md:text-[13px]">
                    {visibleReasons.length ? (
                      visibleReasons.map((reason, index) => (
                        <SignalTextItem
                          key={reason}
                          text={reason}
                          className={index > 1 ? "hidden md:list-item" : ""}
                        />
                      ))
                    ) : (
                      <li>• 분석 가능한 핵심 근거를 아직 수집하지 못했습니다.</li>
                    )}
                  </ul>
                </div>
                <div className="surface-card-strong rounded-[12px] p-2 dark:bg-[var(--surface-3)] md:rounded-[18px] md:p-3">
                  <div className="text-[13px] font-semibold text-slate-700 dark:text-slate-100">주의 포인트</div>
                  <ul className="mt-1.5 space-y-1.25 text-[11px] leading-4.5 text-slate-600 dark:text-slate-300 md:mt-2.5 md:text-[13px]">
                    {visibleRisks.length ? (
                      visibleRisks.map((risk, index) => (
                        <SignalTextItem
                          key={risk}
                          text={risk}
                          className={index > 0 ? "hidden md:list-item" : ""}
                        />
                      ))
                    ) : (
                      <li>• 현재 큰 경고 신호는 제한적입니다.</li>
                    )}
                  </ul>
                </div>
                <div>
                  <div className="mb-2 text-xs font-semibold tracking-[0.12em] text-slate-500 dark:text-slate-400">
                    핵심 지표
                  </div>
                  <div className="grid grid-cols-2 gap-2.5 md:grid-cols-2">
                    {metricItems.map((item) => (
                      <div key={item.label} className={item.mobileHidden ? "hidden md:block" : ""}>
                        <MetricCard
                          compact
                          label={item.label}
                          value={item.value}
                          hint={item.hint}
                          statusLabel={item.statusLabel}
                          tone={item.tone}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
                </section>
            </div>
          </div>

        <section
          className={`waterfall-item ai-shell relative overflow-hidden rounded-[20px] p-3 md:rounded-[24px] md:p-4 ${revealPhase >= 7 ? "is-visible" : ""}`}
          style={{ "--waterfall-delay": "120ms" } as CSSProperties}
        >
          <div className="pointer-events-none absolute -right-16 -top-10 hidden h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(73,178,255,0.16)_0%,rgba(73,178,255,0)_72%)] dark:bg-[radial-gradient(circle,rgba(73,178,255,0.2)_0%,rgba(73,178,255,0)_72%)] md:block" />
          <div className="pointer-events-none absolute left-0 top-0 hidden h-28 w-28 rounded-full bg-[radial-gradient(circle,rgba(35,60,124,0.12)_0%,rgba(35,60,124,0)_72%)] dark:bg-[radial-gradient(circle,rgba(35,60,124,0.2)_0%,rgba(35,60,124,0)_74%)] md:block" />
          <div className="relative min-w-0">
            <h2 className="ai-gradient-text text-base font-black tracking-tight md:text-lg">
              AI 브리핑
            </h2>
            <p className="mt-1.5 hidden max-w-xl break-keep text-xs leading-5 text-slate-600 dark:text-slate-300 md:block">
              차트 흐름과 기업 맥락만 짧게 정리합니다.
            </p>
          </div>
          <div className="mt-2.5 space-y-2.5 text-sm leading-6 text-slate-600 dark:text-slate-300 md:mt-3 md:space-y-3">
            {canUseAi ? (
              <div className="surface-card rounded-[14px] p-2.5 md:rounded-[16px] md:p-3">
                <AuthActions isSignedIn providers={aiProviders} userName={aiUserName} />
              </div>
            ) : null}
            {!isAiAuthAvailable ? (
              <div className="surface-card rounded-[14px] p-3 md:rounded-[16px] md:p-3.5">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  로그인 기능 준비 중이에요.
                </div>
                <p className="mt-1 break-keep text-[13px] leading-5 text-slate-500 dark:text-slate-300">
                  현재 로그인 기능을 준비하지 않았어요. AI 브리핑은 로그인 기능이 준비되면 함께 사용할 수 있습니다.
                </p>
              </div>
            ) : null}
            {isAiAuthAvailable && !canUseAi ? (
              <div className="surface-card rounded-[14px] p-3 md:rounded-[16px] md:p-3.5">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  로그인 후 AI 브리핑을 볼 수 있어요
                </div>
                <p className="mt-1 break-keep text-[13px] leading-5 text-slate-500 dark:text-slate-300">
                  아래 버튼으로 로그인하면 이 종목의 AI 브리핑을 바로 확인할 수 있어요.
                </p>
                <div className="mt-3">
                  <AuthActions providers={aiProviders} />
                </div>
              </div>
            ) : null}
            {canUseAi && !aiRequested ? (
              <div className="surface-card rounded-[14px] p-3 md:rounded-[16px] md:p-3.5">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  AI 브리핑을 바로 생성할 수 있어요.
                </div>
                <p className="mt-1 break-keep text-[13px] leading-5 text-slate-500 dark:text-slate-300">
                  최신 차트와 기업 흐름을 짧게 정리합니다. 같은 조건은 캐시를 재사용합니다.
                </p>
                <button
                  className="brand-button mt-3 rounded-full px-3 py-1.5 text-[11px] font-semibold"
                  type="button"
                  onClick={() => setAiRequested(true)}
                >
                  AI 브리핑 생성
                </button>
              </div>
            ) : null}
            {aiState.loading && !aiSummary?.available ? <AiLoadingCard /> : null}
            {aiRequested && aiSummary?.available ? (
              <>
                {aiState.loading ? (
                  <div className="ai-glow rounded-[14px] border border-[rgba(73,178,255,0.14)] px-3 py-2.5 text-xs font-semibold text-slate-700 dark:border-[rgba(157,196,255,0.14)] dark:text-slate-100">
                    AI 브리핑을 최신 데이터 기준으로 다시 정리하고 있습니다.
                  </div>
                ) : null}
                <div className="grid gap-2.5 xl:grid-cols-[minmax(0,1.1fr)_minmax(260px,0.9fr)] md:gap-3">
                  <div className="space-y-3">
                    <div className="rounded-[14px] border border-[rgba(73,178,255,0.22)] bg-[linear-gradient(135deg,rgba(35,60,124,0.18),rgba(73,178,255,0.14),rgba(255,255,255,0.96))] p-3 dark:border-[rgba(157,196,255,0.2)] dark:bg-[linear-gradient(135deg,rgba(35,60,124,0.3),rgba(73,178,255,0.16),rgba(10,18,30,0.98))] md:rounded-[16px] md:p-3.5">
                      <div className="inline-flex rounded-full bg-white/82 px-2.5 py-1 text-[11px] font-bold tracking-[0.04em] text-[var(--brand-strong)] dark:bg-white/[0.08] dark:text-sky-100">
                        한줄 결론
                      </div>
                      <p className="mt-2 break-keep text-[13px] font-extrabold leading-[1.45] text-slate-950 dark:text-slate-50 md:text-[15px] md:leading-6">
                        {aiSummary.conclusion}
                      </p>
                    </div>
                    <div className="grid gap-3 xl:grid-cols-2">
                      <AiInsightCard
                        label="차트 흐름"
                        text={aiChartSummary}
                        secondaryText={aiMomentumSummary}
                        tone="brand"
                      />
                      <AiInsightCard label="가격 포인트" text={aiSummary.levels ?? ""} tone="default" />
                    </div>
                  </div>
                  <div className="grid gap-3">
                    <div className="rounded-[14px] border border-[rgba(73,178,255,0.2)] bg-[var(--surface-card)] p-3 dark:border-[rgba(73,178,255,0.22)] dark:bg-white/[0.05] md:rounded-[16px] md:p-3.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="inline-flex rounded-full bg-[rgba(73,178,255,0.12)] px-2.5 py-1 text-[11px] font-bold tracking-[0.04em] text-[var(--brand-strong)] dark:bg-[rgba(73,178,255,0.14)] dark:text-sky-100">
                          기업·업종
                        </div>
                        {companyContextTags.map((tag) => (
                          <div
                            key={tag}
                            className="inline-flex rounded-full border border-[rgba(73,178,255,0.18)] bg-white/78 px-2.5 py-1 text-[11px] font-semibold text-[var(--brand-strong)] dark:border-[rgba(73,178,255,0.16)] dark:bg-white/[0.06] dark:text-sky-100"
                          >
                            {tag}
                          </div>
                        ))}
                      </div>
                      <p className="mt-2 break-keep text-sm font-semibold leading-5 text-slate-900 dark:text-slate-50">
                        {companyContextHeadline}
                      </p>
                      <p className="mt-1 break-keep text-[13px] leading-5 text-slate-700 dark:text-slate-200">
                        {companyContextSupport}
                      </p>
                    </div>
                    <AiInsightCard
                      label="체크 포인트"
                      text={aiRiskSummary}
                      tone="risk"
                    />
                  </div>
                </div>
              </>
            ) : null}
            {aiRequested && aiSummary && !aiSummary.available && !aiState.loading ? (
              <div className="rounded-[14px] border border-slate-200/80 bg-slate-50 p-3 dark:border-white/10 dark:bg-[var(--surface-3)] md:rounded-[16px] md:p-3.5">
                <div className="font-semibold text-slate-800 dark:text-slate-100">AI 요약을 사용할 수 없습니다.</div>
                <p className="mt-2 break-keep">
                  {getAiUnavailableCopy(aiSummary.reason)}
                </p>
              </div>
            ) : null}
            {aiRequested ? (
              <div className="brand-note rounded-[14px] px-3 py-2.5 text-xs break-keep md:rounded-[16px] md:px-3.5 md:py-3">
                {aiSummary?.disclaimer ??
                  "이 분석은 기술적 지표를 바탕으로 한 참고 정보이며 투자 판단의 책임은 사용자에게 있습니다."}
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
