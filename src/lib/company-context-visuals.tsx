import type { ComponentType, CSSProperties } from "react";
import {
  IconBatteryFilled,
  IconBoltFilled,
  IconBuildingBank,
  IconBuildingSkyscraper,
  IconBuildingStore,
  IconCarFilled,
  IconChartArrows,
  IconChefHatFilled,
  IconCode,
  IconCpu2,
  IconDeviceTvFilled,
  IconFlameFilled,
  IconFlaskFilled,
  IconHomeDollar,
  IconMicroscopeFilled,
  IconMusic,
  IconPhoneFilled,
  IconPlaneFilled,
  IconRobot,
  IconSchoolFilled,
  IconShieldFilled,
  IconShirtFilled,
  IconShip,
  IconSparklesFilled,
  IconStethoscope,
  IconSunFilled,
  IconTruckFilled,
  IconWorldWww,
} from "@tabler/icons-react";

import { getStockBrandProfile } from "@/lib/stock-branding";
import type { CompanyContext, StockLookupItem } from "@/lib/types";

type ContextIcon = ComponentType<{ size?: number; stroke?: number; className?: string }>;
type CssVars = CSSProperties & Record<`--${string}`, string>;

type ContextVisual = {
  Icon: ContextIcon;
  accent: string;
  soft: string;
  iconStroke?: number;
};

const DEFAULT_VISUAL: ContextVisual = {
  Icon: IconSparklesFilled,
  accent: "#245787",
  soft: "rgba(36, 87, 135, 0.12)",
  iconStroke: 1.8,
};

const CONTEXT_VISUAL_RULES: Array<{ match: RegExp; visual: ContextVisual }> = [
  { match: /(ETF|ETN|인버스|레버리지)/, visual: { Icon: IconChartArrows, accent: "#3485FA", soft: "rgba(52,133,250,0.12)", iconStroke: 1.8 } },
  { match: /(반도체|전자·IT하드웨어)/, visual: { Icon: IconCpu2, accent: "#4C6FFF", soft: "rgba(76,111,255,0.12)", iconStroke: 1.8 } },
  { match: /(전력·전선|전기·전력장비|유틸리티·에너지인프라)/, visual: { Icon: IconBoltFilled, accent: "#FF9F1C", soft: "rgba(255,159,28,0.14)" } },
  { match: /(자동차|운송장비)/, visual: { Icon: IconCarFilled, accent: "#FF6B57", soft: "rgba(255,107,87,0.13)" } },
  { match: /(태양광·신재생에너지)/, visual: { Icon: IconSunFilled, accent: "#F5A524", soft: "rgba(245,165,36,0.14)" } },
  { match: /(2차전지)/, visual: { Icon: IconBatteryFilled, accent: "#00A76F", soft: "rgba(0,167,111,0.14)" } },
  { match: /(정유·에너지)/, visual: { Icon: IconFlameFilled, accent: "#FF7A45", soft: "rgba(255,122,69,0.14)" } },
  { match: /(화학)/, visual: { Icon: IconFlaskFilled, accent: "#8B5CF6", soft: "rgba(139,92,246,0.12)" } },
  { match: /(바이오·제약)/, visual: { Icon: IconMicroscopeFilled, accent: "#14B8A6", soft: "rgba(20,184,166,0.12)" } },
  { match: /(의료기기·헬스케어)/, visual: { Icon: IconStethoscope, accent: "#0EA5E9", soft: "rgba(14,165,233,0.12)", iconStroke: 1.9 } },
  { match: /(엔터테인먼트)/, visual: { Icon: IconMusic, accent: "#F973AE", soft: "rgba(249,115,174,0.12)", iconStroke: 1.8 } },
  { match: /(미디어·콘텐츠)/, visual: { Icon: IconDeviceTvFilled, accent: "#A855F7", soft: "rgba(168,85,247,0.12)" } },
  { match: /(인터넷·플랫폼·게임)/, visual: { Icon: IconWorldWww, accent: "#2563EB", soft: "rgba(37,99,235,0.12)", iconStroke: 1.8 } },
  { match: /(소프트웨어·AI)/, visual: { Icon: IconCode, accent: "#245787", soft: "rgba(36,87,135,0.12)", iconStroke: 1.8 } },
  { match: /(로봇·자동화)/, visual: { Icon: IconRobot, accent: "#06B6D4", soft: "rgba(6,182,212,0.12)", iconStroke: 1.8 } },
  { match: /(조선·중공업)/, visual: { Icon: IconShip, accent: "#0F766E", soft: "rgba(15,118,110,0.12)", iconStroke: 1.8 } },
  { match: /(방산)/, visual: { Icon: IconShieldFilled, accent: "#7C3AED", soft: "rgba(124,58,237,0.12)" } },
  { match: /(건설)/, visual: { Icon: IconBuildingSkyscraper, accent: "#475569", soft: "rgba(71,85,105,0.12)", iconStroke: 1.8 } },
  { match: /(리츠·부동산)/, visual: { Icon: IconHomeDollar, accent: "#0F766E", soft: "rgba(15,118,110,0.12)", iconStroke: 1.8 } },
  { match: /(금융)/, visual: { Icon: IconBuildingBank, accent: "#1D4ED8", soft: "rgba(29,78,216,0.12)", iconStroke: 1.8 } },
  { match: /(철강·소재)/, visual: { Icon: IconSparklesFilled, accent: "#64748B", soft: "rgba(100,116,139,0.12)" } },
  { match: /(통신)/, visual: { Icon: IconPhoneFilled, accent: "#2563EB", soft: "rgba(37,99,235,0.12)" } },
  { match: /(여행·항공·레저)/, visual: { Icon: IconPlaneFilled, accent: "#06B6D4", soft: "rgba(6,182,212,0.12)" } },
  { match: /(유통·리테일)/, visual: { Icon: IconBuildingStore, accent: "#F97316", soft: "rgba(249,115,22,0.12)", iconStroke: 1.8 } },
  { match: /(식품·소비재)/, visual: { Icon: IconChefHatFilled, accent: "#F59E0B", soft: "rgba(245,158,11,0.14)" } },
  { match: /(화장품)/, visual: { Icon: IconSparklesFilled, accent: "#EC4899", soft: "rgba(236,72,153,0.12)" } },
  { match: /(해운·물류)/, visual: { Icon: IconTruckFilled, accent: "#0EA5E9", soft: "rgba(14,165,233,0.12)" } },
  { match: /(의류·패션)/, visual: { Icon: IconShirtFilled, accent: "#D946EF", soft: "rgba(217,70,239,0.12)" } },
  { match: /(교육)/, visual: { Icon: IconSchoolFilled, accent: "#7C3AED", soft: "rgba(124,58,237,0.12)" } },
];

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(normalized)) {
    return null;
  }

  const value = Number.parseInt(normalized, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function withAlpha(color: string, alpha: number) {
  const rgb = hexToRgb(color);
  if (!rgb) {
    return color;
  }

  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

function resolveTextColor(color: string, fallback: string) {
  const rgb = hexToRgb(color);
  if (!rgb) {
    return fallback;
  }

  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.64 ? fallback : color;
}

function isLightAccent(color: string) {
  const rgb = hexToRgb(color);
  if (!rgb) {
    return false;
  }

  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.58;
}

function getContextVisual(context: CompanyContext) {
  return (
    CONTEXT_VISUAL_RULES.find((rule) => rule.match.test(context.sector))?.visual ??
    DEFAULT_VISUAL
  );
}

export function getCompanyContextVisuals(stock: StockLookupItem, context: CompanyContext) {
  const brand = getStockBrandProfile(stock);
  const sector = getContextVisual(context);
  const brandText = resolveTextColor(brand.accent, brand.textColor);
  const sectorText = resolveTextColor(sector.accent, "#0F172A");
  const lightAccent = isLightAccent(sector.accent);
  const iconForeground = lightAccent ? "#0F172A" : sector.accent;
  const iconSurface = "#FFFFFF";
  const iconSurfaceDark = "rgba(255,255,255,0.96)";
  const brandLabel =
    context.group ? `${context.group} 그룹` : context.instrumentLabel !== "개별 종목" ? context.instrumentLabel : stock.market;

  return {
    brandLabel,
    headlineIcon: sector.Icon,
    headlineStyle: {
      borderColor: withAlpha(sector.accent, 0.22),
      backgroundColor: withAlpha(sector.accent, 0.12),
      color: sectorText,
    } satisfies CSSProperties,
    headlineIconStyle: {
      backgroundColor: iconSurface,
      color: iconForeground,
      border: `1px solid ${withAlpha(sector.accent, 0.12)}`,
      boxShadow: `0 10px 22px ${withAlpha(sector.accent, 0.12)}`,
    } satisfies CSSProperties,
    groupChipStyle: {
      "--chip-border": withAlpha(brand.accent, 0.24),
      "--chip-bg": brand.accentSoft,
      "--chip-text": brandText,
      "--chip-border-dark": withAlpha(brand.accent, 0.38),
      "--chip-bg-dark": withAlpha(brand.accent, 0.3),
      "--chip-text-dark": "#F8FAFC",
    } satisfies CssVars,
    sectorChipStyle: {
      "--chip-border": withAlpha(sector.accent, 0.22),
      "--chip-bg": sector.soft,
      "--chip-text": sectorText,
      "--chip-border-dark": withAlpha(sector.accent, 0.4),
      "--chip-bg-dark": withAlpha(sector.accent, 0.28),
      "--chip-text-dark": "#F8FAFC",
    } satisfies CssVars,
    sectorIconStyle: {
      "--chip-icon-bg": iconSurface,
      "--chip-icon-color": iconForeground,
      "--chip-icon-bg-dark": iconSurfaceDark,
      "--chip-icon-color-dark": iconForeground,
    } satisfies CssVars,
    sectorIconStroke: sector.iconStroke ?? 1.9,
    SectorIcon: sector.Icon,
  };
}
