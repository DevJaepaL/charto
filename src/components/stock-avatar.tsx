"use client";

import type { CSSProperties } from "react";
import Image from "next/image";

import { getStockBrandProfile } from "@/lib/stock-branding";
import type { StockLookupItem } from "@/lib/types";

interface StockAvatarProps {
  stock: StockLookupItem;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
}

const sizeClassName = {
  xs: "h-8 w-8 rounded-[10px]",
  sm: "h-10 w-10 rounded-[14px]",
  md: "h-12 w-12 rounded-[16px]",
  lg: "h-14 w-14 rounded-[18px]",
  xl: "h-20 w-20 rounded-[24px]",
} as const;

const logoPaddingClassName = {
  xs: "p-0.75",
  sm: "p-1",
  md: "p-1.5",
  lg: "p-2",
  xl: "p-2.5",
} as const;

export function StockAvatar({ stock, size = "md" }: StockAvatarProps) {
  const profile = getStockBrandProfile(stock);
  const style = {
    backgroundColor: profile.logoType === "asset" ? "rgba(255,255,255,0.98)" : "transparent",
    borderColor:
      profile.logoType === "asset" ? "rgba(203, 213, 225, 0.88)" : profile.accentSoft,
  } satisfies CSSProperties;

  return (
    <div
      aria-hidden
      className={`${sizeClassName[size]} ${profile.logoType === "asset" ? "asset-logo-tile" : ""} relative flex shrink-0 items-center justify-center overflow-hidden border bg-white font-black tracking-[0.08em]`}
      style={style}
    >
      <Image
        alt=""
        aria-hidden
        className={`object-contain ${logoPaddingClassName[size]} ${profile.logoClassName ?? ""}`}
        fill
        sizes={
          size === "xl"
            ? "80px"
            : size === "lg"
              ? "56px"
              : size === "md"
                ? "48px"
                : size === "sm"
                  ? "40px"
                  : "32px"
        }
        src={profile.logoSrc}
      />
    </div>
  );
}
