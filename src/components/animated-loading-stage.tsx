"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { StockAvatar } from "@/components/stock-avatar";
import type { StockLookupItem } from "@/lib/types";

const DOT_FRAMES = ["", ".", "..", "..."];
const LOADING_MESSAGES = [
  "가격과 거래량을 함께 보고 있어요.",
  "핵심 신호와 추천 점수를 계산하고 있어요.",
  "지금 흐름을 보기 쉽게 정리하고 있어요.",
];

interface AnimatedLoadingStageProps {
  compact?: boolean;
  stock?: StockLookupItem;
  title?: string;
}

export function AnimatedLoadingStage({
  compact = false,
  stock,
  title = "종목과 차트를 분석하고 있어요",
}: AnimatedLoadingStageProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [dotFrameIndex, setDotFrameIndex] = useState(0);
  const [progressIndex, setProgressIndex] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const dotTimer = window.setInterval(() => {
      setDotFrameIndex((current) => (current + 1) % DOT_FRAMES.length);
    }, 520);

    const progressTimer = window.setInterval(() => {
      setProgressIndex((current) => (current + 1) % 3);
    }, 1120);

    const messageTimer = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % LOADING_MESSAGES.length);
    }, 2800);

    return () => {
      window.clearInterval(dotTimer);
      window.clearInterval(progressTimer);
      window.clearInterval(messageTimer);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let revert: (() => void) | null = null;

    if (!rootRef.current || typeof window === "undefined") {
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    void import("animejs")
      .then(({ createScope, createTimeline, stagger }) => {
        if (cancelled || !rootRef.current) {
          return;
        }

        const scope = createScope({ root: rootRef.current }).add(() => {
          const intro = createTimeline({
            defaults: {
              ease: "outExpo",
            },
          });

          intro
            .add(
              "[data-loading-shell]",
              {
                opacity: [0, 1],
                translateY: [compact ? 10 : 18, 0],
                scale: [0.98, 1],
                duration: compact ? 360 : 520,
              },
              0,
            )
            .add(
              "[data-loading-orbit]",
              {
                opacity: [0, 1],
                scale: [0.86, 1],
                duration: compact ? 620 : 860,
              },
              0,
            )
            .add(
              "[data-loading-title]",
              {
                opacity: [0, 1],
                translateY: [compact ? 8 : 14, 0],
                duration: compact ? 420 : 560,
              },
              compact ? 140 : 220,
            )
            .add(
              "[data-loading-message]",
              {
                opacity: [0, 1],
                translateY: [compact ? 6 : 10, 0],
                duration: compact ? 400 : 520,
              },
              compact ? 220 : 320,
            )
            .add(
              "[data-loading-card]",
              {
                opacity: [0, 1],
                translateY: [16, 0],
                delay: stagger(110),
                duration: 540,
              },
              compact ? 0 : 420,
            );

          const orbitFloat = createTimeline({
            loop: true,
            alternate: true,
            defaults: {
              duration: compact ? 2400 : 3000,
              ease: "inOutSine",
            },
          })
            .add(
              "[data-loading-orbit]",
              {
                translateY: [0, compact ? 3 : 8],
                scale: [1, compact ? 1.02 : 1.04],
              },
              0,
            )
            .add(
              "[data-loading-avatar]",
              {
                scale: [1, compact ? 1.03 : 1.05],
              },
              0,
            );

          const skeletonPulse = createTimeline({
            loop: true,
            alternate: true,
            defaults: {
              duration: 2200,
              ease: "inOutSine",
            },
          }).add(
            "[data-loading-skeleton]",
            {
              opacity: [0.38, 0.96],
              scaleX: [0.985, 1],
              delay: stagger(90),
            },
            0,
          );

          return () => {
            skeletonPulse.revert();
            orbitFloat.revert();
            intro.revert();
          };
        });

        revert = () => scope.revert();
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
      revert?.();
    };
  }, [compact, stock?.symbol, title]);

  const dots = DOT_FRAMES[dotFrameIndex];
  const message = useMemo(() => LOADING_MESSAGES[messageIndex], [messageIndex]);

  if (compact) {
    return (
      <div
        ref={rootRef}
        className="surface-card flex items-center gap-3 rounded-[16px] px-3.5 py-3 shadow-[0_14px_34px_rgba(15,23,42,0.08)] dark:shadow-[0_18px_38px_rgba(2,6,23,0.36)]"
        data-loading-shell
      >
        <div className="relative flex h-[46px] w-[46px] shrink-0 items-center justify-center">
          <div className="loading-orbit loading-orbit--sm shrink-0" aria-hidden="true" data-loading-orbit>
            <span className="loading-ring loading-ring--outer" data-loading-ring="outer" />
            <span className="loading-ring loading-ring--inner" data-loading-ring="inner" />
          </div>
          {stock ? (
            <div className="absolute inset-0 flex items-center justify-center" data-loading-avatar>
              <StockAvatar size="xs" stock={stock} />
            </div>
          ) : null}
        </div>
        <div className="min-w-0">
          <div className="truncate text-[11px] font-bold text-slate-900 dark:text-slate-50 md:text-[12px]" data-loading-title>
            {stock?.name ?? "CHARTO"}
          </div>
          <div className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-300" data-loading-message>
            {title}
            <span className="inline-block min-w-[1.8ch] pl-0.5 font-bold text-[var(--brand-strong)]">
              {dots}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className="loading-stage mx-auto max-w-2xl rounded-[24px] px-5 py-7 text-center md:rounded-[28px] md:px-8 md:py-9"
      data-loading-shell
    >
      <div className="mt-2 flex justify-center">
        <div className="relative flex h-[112px] w-[112px] shrink-0 items-center justify-center">
          <div className="loading-orbit loading-orbit--lg shrink-0" aria-hidden="true" data-loading-orbit>
            <span className="loading-ring loading-ring--outer" data-loading-ring="outer" />
            <span className="loading-ring loading-ring--inner" data-loading-ring="inner" />
          </div>
          {stock ? (
            <div className="absolute inset-0 flex items-center justify-center" data-loading-avatar>
              <StockAvatar size="sm" stock={stock} />
            </div>
          ) : null}
        </div>
      </div>
      <div className="mt-5 loading-progress-dots" aria-hidden="true">
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            data-loading-dot
            className={index === progressIndex ? "is-active" : index < progressIndex ? "is-past" : ""}
          />
        ))}
      </div>
      <h1 className="mt-5 text-[1.45rem] font-extrabold tracking-tight text-slate-950 dark:text-slate-50 md:text-[1.95rem]" data-loading-title>
        {title}
        <span className="inline-block min-w-[2.2ch] pl-1 font-extrabold text-[var(--brand-strong)]">
          {dots}
        </span>
      </h1>
      <p className="mt-2 text-[13px] leading-6 text-slate-500 dark:text-slate-300 md:text-[14px]" data-loading-message>
        {message}
      </p>
      <div className="mt-6 grid gap-2.5 md:grid-cols-3">
        {["현재가", "추천 점수", "핵심 신호"].map((label, index) => (
          <div
            key={label}
            className="surface-card rounded-[16px] px-4 py-3 text-left md:rounded-[18px] md:px-[18px]"
            data-loading-card
            style={{ animationDelay: `${index * 120}ms` }}
          >
            <div className="text-[10px] font-semibold tracking-[0.12em] text-slate-500 dark:text-slate-400">
              {label}
            </div>
            <div className="mt-2 h-3.5 rounded-full bg-slate-200/90 loading-skeleton dark:bg-white/10" data-loading-skeleton />
            <div className="mt-2 h-2.5 w-14 rounded-full bg-slate-100 loading-skeleton dark:bg-white/[0.05]" data-loading-skeleton />
          </div>
        ))}
      </div>
    </div>
  );
}
