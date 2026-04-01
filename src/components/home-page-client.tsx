"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
  const featuredLinks = featured.slice(0, 10);

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

  return (
    <main className="home-shell page-mobile-shell relative mx-auto min-h-[calc(100vh-160px)] overflow-hidden px-4 pb-12 pt-4">
      <section key={entryKey} ref={sectionRef} className="relative flex min-h-full flex-col gap-6">
        <div className="flex flex-1 flex-col items-center justify-center gap-6 pb-4 pt-8">
          <div className="home-reveal relative w-full max-w-[22rem] text-center [--reveal-delay:120ms]" data-home-brand-shell>
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
            <div className="relative flex flex-col items-center">
              <div
                className="font-korean-display text-[3.05rem] font-bold leading-none tracking-[-0.6px] text-[#314a75] dark:text-slate-50"
                data-home-brand-block
                style={{ textShadow: "0 12px 24px rgba(49,74,117,0.1)" }}
              >
                CHARTO
              </div>
              <div
                className="mt-2 h-[3px] w-24 rounded-full bg-[linear-gradient(90deg,rgba(49,74,117,0.12),rgba(79,120,185,0.5),rgba(79,120,185,0.12))]"
                data-home-brand-underline
              />
            </div>
          </div>

          <div className="home-reveal w-full max-w-[18rem] text-center [--reveal-delay:180ms]" data-home-title-block>
            <h1 className="font-korean-display text-[1.18rem] font-bold leading-[1.6] text-slate-950 dark:text-slate-50">
              <span className="block">
                국내 증시 종목을
              </span>
              <span className="block">
                기술적으로 분석해드려요.
              </span>
            </h1>
          </div>

          <div className="home-reveal home-search-stage w-full max-w-[21.5rem] [--reveal-delay:200ms]" data-home-search-shell>
            <StockSearch featured={featured.slice(0, 8)} variant="hero" />
            <div data-home-favorites-shell>
              <HomeFavoritesStrip userKey={userKey} />
            </div>
          </div>

          <div className="w-full max-w-[21.5rem]">
            <div className="rounded-[18px] border border-slate-200/80 bg-white/92 p-3 shadow-[0_14px_36px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[rgba(8,13,20,0.82)] dark:shadow-[0_18px_42px_rgba(3,7,14,0.22)]">
              <div className="text-[11px] font-semibold tracking-[0.08em] text-slate-500 dark:text-slate-400">
                대표 종목 바로가기
              </div>
              <nav
                aria-label="대표 종목 분석 링크"
                className="mt-2.5 flex flex-wrap gap-2"
              >
                {featuredLinks.map((item) => (
                  <Link
                    key={item.symbol}
                    className="inline-flex items-center rounded-full border border-slate-200/80 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-100 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:bg-white/[0.07]"
                    href={`/analyze/${item.symbol}`}
                  >
                    {item.name}
                    <span className="ml-1 text-[10px] text-slate-400 dark:text-slate-500">
                      {item.symbol}
                    </span>
                  </Link>
                ))}
              </nav>
            </div>
          </div>

          {preview ? (
            <div className="home-reveal w-full max-w-[20.5rem] [--reveal-delay:320ms]" data-home-preview-shell>
              <HeroPreviewCard preview={preview} />
            </div>
          ) : null}

          <div
            className="home-reveal w-full max-w-[20.5rem] px-1 text-center text-[12px] leading-5 text-slate-500 dark:text-slate-300 [--reveal-delay:300ms]"
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
                이미 계정이 있나요?
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
