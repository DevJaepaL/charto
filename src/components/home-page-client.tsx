"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconArrowRight, IconChartCandle, IconSparkles, IconStars } from "@tabler/icons-react";

import { HeroPreviewCard } from "@/components/hero-preview-card";
import { HomeFavoritesStrip } from "@/components/home-favorites-strip";
import { StockSearch } from "@/components/stock-search";
import type { StockLookupItem, TechnicalResponse } from "@/lib/types";

interface HomePageClientProps {
  featured: StockLookupItem[];
  userKey: string | null;
  userName: string;
  isSignedIn: boolean;
  preview: TechnicalResponse | null;
}

function HomeStatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="surface-card rounded-[18px] px-4 py-3">
      <div className="text-[10px] font-semibold tracking-[0.12em] text-slate-500 dark:text-slate-400">
        {label}
      </div>
      <div className="mt-1 text-[1.1rem] font-black tracking-tight text-slate-950 dark:text-slate-50">
        {value}
      </div>
      <div className="mt-1 text-[11px] leading-4.5 text-slate-500 dark:text-slate-300">{hint}</div>
    </div>
  );
}

function HomeFeatureCard({
  icon,
  title,
  description,
  href,
  cta,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  href: string;
  cta: string;
}) {
  return (
    <Link
      className="surface-card group rounded-[20px] px-4 py-4 transition-transform hover:-translate-y-0.5"
      href={href}
    >
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-[14px] bg-[var(--brand-soft)] text-[var(--brand-strong)]">
        {icon}
      </div>
      <div className="mt-3 text-[15px] font-black tracking-tight text-slate-950 dark:text-slate-50">
        {title}
      </div>
      <p className="mt-2 text-[12px] leading-5 text-slate-600 dark:text-slate-300">{description}</p>
      <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--brand-strong)] dark:text-slate-100">
        <span>{cta}</span>
        <IconArrowRight size={14} />
      </div>
    </Link>
  );
}

export function HomePageClient({
  featured,
  userKey,
  userName,
  isSignedIn,
  preview,
}: HomePageClientProps) {
  const pathname = usePathname();
  const hasMountedRef = useRef(false);
  const sectionRef = useRef<HTMLElement | null>(null);
  const [entryKey, setEntryKey] = useState(0);

  useEffect(() => {
    if (pathname !== "/") {
      return;
    }

    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    setEntryKey((current) => current + 1);
  }, [pathname]);

  useEffect(() => {
    let cancelled = false;
    let revert: (() => void) | null = null;

    if (!sectionRef.current || typeof window === "undefined") {
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    void import("animejs").then(({ createScope, createTimeline, stagger }) => {
      if (cancelled || !sectionRef.current) {
        return;
      }

      const scope = createScope({ root: sectionRef.current }).add(() => {
        const hasPreview = Boolean(sectionRef.current?.querySelector("[data-home-preview-shell]"));
        const timeline = createTimeline({
          defaults: {
            duration: 680,
            ease: "outExpo",
          },
        });

        timeline
          .add(
            "[data-home-brand-shell]",
            {
              opacity: [0, 1],
              translateY: [14, 0],
              scale: [0.985, 1],
              duration: 760,
            },
            0,
          )
          .add(
            "[data-home-brand-block]",
            {
              opacity: [0.78, 1],
              filter: ["blur(6px)", "blur(0px)"],
              duration: 620,
            },
            40,
          )
          .add(
            "[data-home-brand-orb]",
            {
              opacity: [0, 1],
              scale: [0.82, 1],
              delay: stagger(140),
              duration: 840,
            },
            80,
          )
          .add(
            "[data-home-brand-underline]",
            {
              opacity: [0, 1],
              scaleX: [0.72, 1],
              duration: 620,
            },
            120,
          )
          .add(
            "[data-home-title-block]",
            {
              opacity: [0, 1],
              translateY: [14, 0],
              duration: 620,
            },
            160,
          )
          .add(
            "[data-home-search-shell]",
            {
              opacity: [0, 1],
              translateY: [16, 0],
              duration: 620,
            },
            240,
          );

        if (hasPreview) {
          timeline.add(
            "[data-home-preview-shell]",
            {
              opacity: [0, 1],
              translateY: [18, 0],
              scale: [0.985, 1],
              duration: 680,
            },
            320,
          );
        }

        timeline.add(
          "[data-home-login-copy]",
          {
            opacity: [0, 1],
            translateY: [12, 0],
            duration: 560,
          },
          hasPreview ? 400 : 320,
        );

        const ambient = createTimeline({
          loop: true,
          alternate: true,
          defaults: {
            duration: 3400,
            ease: "inOutSine",
          },
        })
          .add(
            '[data-home-preview-orb="primary"]',
            {
              translateX: [0, 14],
              translateY: [0, 18],
              scale: [1, 1.08],
            },
            0,
          )
          .add(
            '[data-home-preview-orb="secondary"]',
            {
              translateX: [0, -18],
              translateY: [0, -14],
              scale: [1, 1.12],
            },
            0,
          )
          .add(
            "[data-home-brand-orb='primary']",
            {
              translateX: [0, 12],
              translateY: [0, -10],
              scale: [1, 1.08],
            },
            0,
          )
          .add(
            "[data-home-brand-orb='secondary']",
            {
              translateX: [0, -14],
              translateY: [0, 12],
              scale: [1, 1.14],
            },
            0,
          );

        return () => {
          ambient.revert();
          timeline.revert();
        };
      });

      revert = () => scope.revert();
    }).catch(() => {
      if (!sectionRef.current) {
        return;
      }

      sectionRef.current
        .querySelectorAll<HTMLElement>(".home-reveal")
        .forEach((element) => {
          element.style.opacity = "1";
          element.style.transform = "none";
        });
    });

    return () => {
      cancelled = true;
      revert?.();
    };
  }, [entryKey]);

  const previewLabel = preview ? `${preview.stock.name} 샘플` : "대표 종목 기준";

  return (
    <main className="home-shell page-mobile-shell relative mx-auto min-h-[calc(100vh-160px)] overflow-hidden px-4 pb-12 pt-4">
      <section key={entryKey} ref={sectionRef} className="relative flex min-h-full flex-col gap-6">
        <div className="flex flex-1 flex-col gap-5 pb-4 pt-6">
          <div className="home-reveal home-stage relative overflow-hidden rounded-[28px] px-4 py-5 [--reveal-delay:120ms]" data-home-brand-shell>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -left-5 -top-4 h-20 w-20 rounded-full bg-[rgba(73,178,255,0.16)] blur-2xl"
              data-home-brand-orb="primary"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute right-4 top-8 h-16 w-16 rounded-full bg-[rgba(123,97,255,0.16)] blur-2xl"
              data-home-brand-orb="secondary"
            />
            <div className="relative">
              <div className="flex items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/88 px-3 py-1 text-[10px] font-semibold tracking-[0.12em] text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200">
                  <span className="inline-flex h-2 w-2 rounded-full bg-[var(--accent-cyan)]" />
                  KOREA MARKET WORKSPACE
                </div>
                <Link
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200/80 bg-white/88 px-3 py-1 text-[10px] font-semibold text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200"
                  href="/stocks"
                >
                  대표 종목
                  <IconArrowRight size={12} />
                </Link>
              </div>

              <div className="mt-5" data-home-title-block>
                <div
                  className="font-korean-display text-[2.5rem] font-bold leading-none tracking-[-0.7px] text-[#314a75] dark:text-slate-50"
                  data-home-brand-block
                  style={{ textShadow: "0 12px 24px rgba(49,74,117,0.1)" }}
                >
                  CHARTO
                </div>
                <div
                  className="mt-2 h-[3px] w-24 rounded-full bg-[linear-gradient(90deg,rgba(49,74,117,0.12),rgba(79,120,185,0.5),rgba(79,120,185,0.12))]"
                  data-home-brand-underline
                />
                <h1 className="mt-5 font-korean-display text-[1.5rem] font-bold leading-[1.45] text-slate-950 dark:text-slate-50">
                  국내 종목의 흐름을
                  <br />
                  차트부터 업종까지 빠르게 봅니다.
                </h1>
                <p className="mt-3 max-w-[28rem] text-[13px] leading-6 text-slate-600 dark:text-slate-300">
                  검색으로 바로 진입하고, 가격 흐름과 기술지표, 기업·업종 포인트, AI 브리핑까지 한 화면에 정리합니다.
                </p>
              </div>

              <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
                <HomeStatTile hint="기술지표와 차트" label="분석 기준" value="일봉 중심" />
                <HomeStatTile hint={`${featured.length}개 대표 종목`} label="빠른 진입" value="즉시 검색" />
                <HomeStatTile hint="홈 샘플 미리보기" label="현재 샘플" value={previewLabel} />
              </div>
            </div>
          </div>

          <div className="home-reveal home-search-stage [--reveal-delay:200ms]" data-home-search-shell>
            <StockSearch featured={featured.slice(0, 8)} variant="hero" />
            <div data-home-favorites-shell>
              <HomeFavoritesStrip userKey={userKey} />
            </div>
          </div>

          {preview ? (
            <div className="home-reveal [--reveal-delay:280ms]" data-home-preview-shell>
              <HeroPreviewCard preview={preview} />
            </div>
          ) : null}

          <div className="home-reveal grid gap-3 [--reveal-delay:320ms] sm:grid-cols-3">
            <HomeFeatureCard
              cta="대표 종목 보러가기"
              description="현재가와 추천 점수, 지지·저항, 거래량 상태를 한 번에 확인합니다."
              href="/stocks"
              icon={<IconChartCandle size={20} stroke={1.9} />}
              title="차트 중심 분석"
            />
            <HomeFeatureCard
              cta="샘플 분석 열기"
              description="기업 맥락과 업종 흐름을 같이 붙여서, 숫자만 보는 화면을 줄였습니다."
              href={preview ? `/analyze/${preview.stock.symbol}` : "/stocks"}
              icon={<IconStars size={20} stroke={1.9} />}
              title="기업·업종 포인트"
            />
            <HomeFeatureCard
              cta={isSignedIn ? "계정 관리" : "로그인하기"}
              description="로그인하면 AI 브리핑과 관심종목 흐름을 더 빠르게 이어볼 수 있습니다."
              href="/login"
              icon={<IconSparkles size={20} stroke={1.9} />}
              title="개인화와 AI"
            />
          </div>

          <div
            className="home-reveal rounded-[18px] border border-slate-200/80 bg-white/82 px-4 py-3 text-[12px] leading-5 text-slate-500 shadow-[0_12px_30px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300 [--reveal-delay:360ms]"
            data-home-login-copy
          >
            {isSignedIn ? (
              <p className="break-keep">
                <span className="font-semibold text-slate-900 dark:text-slate-100">{userName}</span>
                <span className="ml-1">계정으로 로그인되어 있어요.</span>
                <Link className="ml-1 font-semibold text-[var(--brand-strong)] underline underline-offset-4 dark:text-sky-100" href="/login">
                  계정 관리
                </Link>
              </p>
            ) : (
              <p className="break-keep">
                검색만으로 바로 쓸 수 있고, 로그인하면 AI 브리핑과 관심종목이 함께 붙습니다.
                <Link className="ml-1 font-semibold text-[var(--brand-strong)] underline underline-offset-4 dark:text-sky-100" href="/login">
                  로그인하기
                </Link>
              </p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
