"use client";

import { useEffect, useMemo, useState } from "react";

import { StockAvatar } from "@/components/stock-avatar";
import type { StockLookupItem } from "@/lib/types";

const LOADING_MESSAGES = [
  "가격과 거래량을 함께 보고 있어요.",
  "핵심 신호와 차트 점수를 계산하고 있어요.",
  "지금 흐름을 보기 쉽게 정리하고 있어요.",
];

interface AnimatedLoadingStageProps {
  compact?: boolean;
  stock?: StockLookupItem;
  title?: string;
}

function Spinner({ size = "lg" }: { size?: "sm" | "lg" }) {
  return (
    <div
      aria-hidden="true"
      className={`loading-orbit ${size === "sm" ? "loading-orbit--sm" : "loading-orbit--lg"} shrink-0`}
    >
      <span className="loading-ring loading-ring--outer" />
    </div>
  );
}

export function AnimatedLoadingStage({
  compact = false,
  stock,
  title = "종목과 차트를 분석하고 있어요",
}: AnimatedLoadingStageProps) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const messageTimer = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % LOADING_MESSAGES.length);
    }, 2800);

    return () => window.clearInterval(messageTimer);
  }, []);

  const message = useMemo(() => LOADING_MESSAGES[messageIndex], [messageIndex]);

  if (compact) {
    return (
      <div
        className="surface-card flex items-center gap-3 rounded-[12px] px-3.5 py-3"
        role="status"
      >
        <div className="relative flex h-[46px] w-[46px] shrink-0 items-center justify-center">
          <Spinner size="sm" />
          {stock ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <StockAvatar size="xs" stock={stock} />
            </div>
          ) : null}
        </div>
        <div className="min-w-0">
          <div className="truncate text-[11px] font-bold text-slate-900 dark:text-slate-50 md:text-[12px]">
            {stock?.name ?? "CHARTO"}
          </div>
          <div className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-300">{title}</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="loading-stage mx-auto max-w-2xl rounded-[12px] px-5 py-7 text-center md:px-8 md:py-9"
      role="status"
    >
      <div className="mt-2 flex justify-center">
        <div className="relative flex h-[64px] w-[64px] shrink-0 items-center justify-center">
          <Spinner />
          {stock ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <StockAvatar size="xs" stock={stock} />
            </div>
          ) : null}
        </div>
      </div>
      <h1 className="mt-5 text-[1.25rem] font-bold tracking-tight text-slate-950 dark:text-slate-50 md:text-[1.5rem]">
        {title}
      </h1>
      <p className="mt-2 text-[13px] leading-6 text-slate-500 dark:text-slate-300 md:text-[14px]">
        {message}
      </p>
      <div className="mt-6 grid gap-2.5 md:grid-cols-3">
        {["현재가", "차트 신호", "핵심 신호"].map((label) => (
          <div key={label} className="surface-card rounded-[8px] px-4 py-3 text-left">
            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
              {label}
            </div>
            <div className="loading-skeleton mt-2 h-3.5 rounded-[4px] bg-slate-200/90 dark:bg-white/10" />
            <div className="loading-skeleton mt-2 h-2.5 w-14 rounded-[4px] bg-slate-100 dark:bg-white/[0.05]" />
          </div>
        ))}
      </div>
    </div>
  );
}
