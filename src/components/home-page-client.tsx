"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { HeroPreviewCard } from "@/components/hero-preview-card";
import { HomeFavoritesStrip } from "@/components/home-favorites-strip";
import { StockSearch } from "@/components/stock-search";
import type { StockLookupItem } from "@/lib/types";

interface HomePageClientProps {
  featured: StockLookupItem[];
  userKey: string | null;
  userName: string;
  isSignedIn: boolean;
}

export function HomePageClient({
  featured,
  userKey,
  userName,
  isSignedIn,
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

    void import("animejs").then(({ createScope, createTimeline, splitText, stagger }) => {
      if (cancelled || !sectionRef.current) {
        return;
      }

      const scope = createScope({ root: sectionRef.current }).add(() => {
        const brandWords = Array.from(
          sectionRef.current?.querySelectorAll<HTMLElement>("[data-home-brand-word]") ?? [],
        );
        const titleLines = Array.from(
          sectionRef.current?.querySelectorAll<HTMLElement>("[data-home-title-line]") ?? [],
        );
        const brandSplitters = brandWords.map((word) => splitText(word, { chars: true }));
        const titleSplitters = titleLines.map((line) => splitText(line, { chars: true }));
        const brandChars = brandSplitters.flatMap((splitter) => splitter.chars);
        const titleChars = titleSplitters.flatMap((splitter) => splitter.chars);

        const timeline = createTimeline({
          defaults: {
            duration: 860,
            ease: "outExpo",
          },
        });

        timeline
          .add(
            brandChars,
            {
              opacity: [0, 1],
              translateY: ["1.4rem", 0],
              rotateX: ["-88deg", "0deg"],
              filter: ["blur(10px)", "blur(0px)"],
              delay: stagger(34),
              duration: 920,
            },
            0,
          )
          .add(
            "[data-home-brand-orb]",
            {
              opacity: [0, 1],
              scale: [0.68, 1],
              delay: stagger(120),
              duration: 760,
            },
            80,
          )
          .add(
            titleChars,
            {
              opacity: [0, 1],
              translateY: ["0.8rem", 0],
              rotateX: ["-88deg", "0deg"],
              delay: stagger(24),
              duration: 640,
            },
            220,
          )
          .add(
            "[data-home-search-shell]",
            {
              opacity: [0, 1],
              translateY: [28, 0],
              scale: [0.94, 1],
              duration: 620,
            },
            320,
          )
          .add(
            "[data-home-favorites-shell]",
            {
              opacity: [0, 1],
              translateY: [18, 0],
              duration: 520,
            },
            400,
          )
          .add(
            "[data-home-preview-card]",
            {
              opacity: [0, 1],
              translateY: [36, 0],
              scale: [0.93, 1],
              rotateX: ["16deg", "0deg"],
              duration: 780,
            },
            480,
          )
          .add(
            "[data-home-login-copy]",
            {
              opacity: [0, 1],
              translateY: [18, 0],
              duration: 520,
            },
            560,
          )
          .add(
            "[data-home-preview-section]",
            {
              opacity: [0, 1],
              translateY: [18, 0],
              delay: stagger(110),
              duration: 520,
            },
            620,
          )
          .add(
            "[data-home-preview-pill]",
            {
              opacity: [0, 1],
              translateX: [-16, 0],
              delay: stagger(70),
              duration: 460,
            },
            680,
          )
          .add(
            "[data-home-preview-bar]",
            {
              opacity: [0.22, 1],
              scaleY: [0.18, 1],
              delay: stagger(42),
              duration: 760,
              ease: "outBack(1.7)",
            },
            740,
          )
          .add(
            "[data-home-preview-progress]",
            {
              scaleX: [0, 1],
              duration: 880,
            },
            820,
          )
          .add(
            "[data-home-preview-point]",
            {
              opacity: [0, 1],
              translateX: [-18, 0],
              delay: stagger(95),
              duration: 520,
            },
            880,
          )
          .add(
            '[data-home-preview-orb="primary"]',
            {
              opacity: [0, 1],
              scale: [0.65, 1],
              duration: 720,
            },
            620,
          )
          .add(
            '[data-home-preview-orb="secondary"]',
            {
              opacity: [0, 1],
              scale: [0.65, 1],
              duration: 720,
            },
            700,
          );

        const ambient = createTimeline({
          loop: true,
          alternate: true,
          defaults: {
            duration: 2600,
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
          brandSplitters.forEach((splitter) => splitter.revert());
          titleSplitters.forEach((splitter) => splitter.revert());
        };
      });

      revert = () => scope.revert();
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
          <div className="home-reveal relative w-full max-w-[22rem] text-center [--reveal-delay:120ms]">
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
                className='font-korean-display text-[3.05rem] font-bold leading-none tracking-[-0.6px] text-transparent [background-image:linear-gradient(135deg,#20304b_0%,#314a75_48%,#4f78b9_100%)] bg-clip-text dark:[background-image:linear-gradient(135deg,#f5f8fc_0%,#d7e5f8_38%,#9fc0eb_100%)]'
                data-home-brand-word
                style={{ textShadow: "0 14px 28px rgba(49,74,117,0.14)" }}
              >
                Charto
              </div>
              <div className="mt-2 h-[3px] w-24 rounded-full bg-[linear-gradient(90deg,rgba(32,48,75,0.12),rgba(79,120,185,0.72),rgba(79,120,185,0.24))]" />
            </div>
          </div>

          <div className="home-reveal w-full max-w-[18rem] text-center [--reveal-delay:180ms]">
            <h1 className="font-korean-display text-[1.18rem] font-bold leading-[1.6] text-slate-950 dark:text-slate-50">
              <span className="block" data-home-title-line>
                국내 증시 종목을
              </span>
              <span className="block" data-home-title-line>
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

          <div className="home-reveal w-full max-w-[20.5rem] [--reveal-delay:320ms]">
            <HeroPreviewCard />
          </div>

          <div
            className="home-reveal w-full max-w-[20.5rem] px-1 text-center text-[12px] leading-5 text-slate-500 dark:text-slate-300 [--reveal-delay:360ms]"
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
