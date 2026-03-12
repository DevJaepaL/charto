import logoManifest from "@/data/logo-manifest.json";
import type { StockLookupItem } from "@/lib/types";

export interface StockBrandProfile {
  symbol: string;
  monogram: string;
  accent: string;
  accentSoft: string;
  gradientFrom: string;
  gradientTo: string;
  logoClassName?: string;
  logoSrc: string;
  logoType: "asset" | "generated";
  textColor: string;
}

type BrandProfileTemplate = Omit<StockBrandProfile, "symbol" | "monogram"> & {
  monogram?: string;
};

interface LogoManifestEntry {
  logoSrc: string;
  sourceUrl?: string;
  homepage?: string;
  fetchedAt?: string;
  mimeType?: string;
}

const LOGO_MANIFEST = logoManifest as Record<string, LogoManifestEntry>;

const BRAND_FAMILY_RULES: Array<{
  aliases: string[];
  profile: BrandProfileTemplate;
}> = [
  {
    aliases: ["SK하이닉스", "SK hynix"],
    profile: {
      accent: "#EA0029",
      accentSoft: "rgba(234, 0, 41, 0.12)",
      gradientFrom: "#EA0029",
      gradientTo: "#FF7A00",
      logoClassName: "p-1",
      logoSrc: "/logos/sk-hynix.svg",
      logoType: "asset",
      textColor: "#0F172A",
      monogram: "SK",
    },
  },
  {
    aliases: ["삼성"],
    profile: {
      accent: "#1428A0",
      accentSoft: "rgba(20, 40, 160, 0.12)",
      gradientFrom: "#1428A0",
      gradientTo: "#5B8CFF",
      logoClassName: "p-0.5",
      logoSrc: "/logos/samsung.svg",
      logoType: "asset",
      textColor: "#0F172A",
      monogram: "SS",
    },
  },
  {
    aliases: ["두산"],
    profile: {
      accent: "#005EB8",
      accentSoft: "rgba(0, 94, 184, 0.12)",
      gradientFrom: "#005EB8",
      gradientTo: "#3F91E0",
      logoClassName: "p-1 scale-[1.16]",
      logoSrc: "/logos/doosan.svg",
      logoType: "asset",
      textColor: "#0F172A",
      monogram: "DS",
    },
  },
  {
    aliases: ["LG"],
    profile: {
      accent: "#A50034",
      accentSoft: "rgba(165, 0, 52, 0.14)",
      gradientFrom: "#A50034",
      gradientTo: "#F25B78",
      logoClassName: "p-1.5",
      logoSrc: "/logos/lg.svg",
      logoType: "asset",
      textColor: "#0F172A",
      monogram: "LG",
    },
  },
  {
    aliases: ["카카오"],
    profile: {
      accent: "#FEE500",
      accentSoft: "rgba(254, 229, 0, 0.18)",
      gradientFrom: "#FEE500",
      gradientTo: "#FFF3A6",
      logoClassName: "p-1.5",
      logoSrc: "/logos/kakao.svg",
      logoType: "asset",
      textColor: "#0F172A",
      monogram: "KK",
    },
  },
  {
    aliases: ["기아"],
    profile: {
      accent: "#05141F",
      accentSoft: "rgba(5, 20, 31, 0.12)",
      gradientFrom: "#05141F",
      gradientTo: "#4D5A63",
      logoClassName: "p-1 scale-[1.08]",
      logoSrc: "/logos/kia.svg",
      logoType: "asset",
      textColor: "#0F172A",
      monogram: "KIA",
    },
  },
  {
    aliases: ["NAVER", "네이버"],
    profile: {
      accent: "#03C75A",
      accentSoft: "rgba(3, 199, 90, 0.14)",
      gradientFrom: "#03C75A",
      gradientTo: "#14B86A",
      logoClassName: "p-1.5",
      logoSrc: "/logos/naver.svg",
      logoType: "asset",
      textColor: "#0F172A",
      monogram: "N",
    },
  },
];

const STOCK_BRAND_MAP: Record<string, Omit<StockBrandProfile, "symbol">> = {
  "005930": {
    monogram: "SE",
    accent: "#1428A0",
    accentSoft: "rgba(20, 40, 160, 0.12)",
    gradientFrom: "#1428A0",
    gradientTo: "#5B8CFF",
    logoClassName: "p-0.5",
    logoSrc: "/logos/samsung.svg",
    logoType: "asset",
    textColor: "#0F172A",
  },
  "000660": {
    monogram: "SK",
    accent: "#EA0029",
    accentSoft: "rgba(234, 0, 41, 0.12)",
    gradientFrom: "#EA0029",
    gradientTo: "#FF7A00",
    logoClassName: "p-1",
    logoSrc: "/logos/sk-hynix.svg",
    logoType: "asset",
    textColor: "#0F172A",
  },
  "035420": {
    monogram: "N",
    accent: "#03C75A",
    accentSoft: "rgba(3, 199, 90, 0.14)",
    gradientFrom: "#03C75A",
    gradientTo: "#14B86A",
    logoClassName: "p-1.5",
    logoSrc: "/logos/naver.svg",
    logoType: "asset",
    textColor: "#0F172A",
  },
  "005380": {
    monogram: "H",
    accent: "#002C5F",
    accentSoft: "rgba(0, 44, 95, 0.14)",
    gradientFrom: "#002C5F",
    gradientTo: "#4D7EB8",
    logoClassName: "p-1 scale-[1.05]",
    logoSrc: "/logos/hyundai.svg",
    logoType: "asset",
    textColor: "#0F172A",
  },
  "373220": {
    monogram: "LG",
    accent: "#A50034",
    accentSoft: "rgba(165, 0, 52, 0.14)",
    gradientFrom: "#A50034",
    gradientTo: "#F25B78",
    logoClassName: "p-1.5",
    logoSrc: "/logos/lg.svg",
    logoType: "asset",
    textColor: "#0F172A",
  },
  "207940": {
    monogram: "SS",
    accent: "#1E7B83",
    accentSoft: "rgba(30, 123, 131, 0.14)",
    gradientFrom: "#1E7B83",
    gradientTo: "#6CC7BD",
    logoClassName: "p-0.5",
    logoSrc: "/logos/samsung.svg",
    logoType: "asset",
    textColor: "#0F172A",
  },
};

function createMonogram(name: string, symbol: string) {
  const monogramSource = name.replace(/[^A-Za-z0-9가-힣]/g, "");
  return monogramSource.slice(0, 2).toUpperCase() || symbol.slice(-2);
}

function svgToDataUri(svg: string) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function buildGeneratedLogo(monogram: string, gradientFrom: string, gradientTo: string) {
  const safeMonogram = monogram.replace(/[&<>"]/g, "");
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id="g" x1="10" y1="8" x2="54" y2="56" gradientUnits="userSpaceOnUse">
          <stop stop-color="${gradientFrom}" />
          <stop offset="1" stop-color="${gradientTo}" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill="#ffffff" />
      <rect x="5" y="5" width="54" height="54" rx="16" fill="url(#g)" />
      <circle cx="49" cy="15" r="8" fill="white" fill-opacity=".24" />
      <path d="M17 46c8.5-11 17.8-17.2 30-20.6" stroke="white" stroke-opacity=".26" stroke-width="2.4" stroke-linecap="round"/>
      <text x="32" y="39" fill="#0F172A" font-size="${safeMonogram.length >= 3 ? 15 : 21}" font-weight="800" text-anchor="middle" font-family="Noto Sans KR, Apple SD Gothic Neo, Malgun Gothic, sans-serif" letter-spacing="-.04em">${safeMonogram}</text>
    </svg>
  `;

  return svgToDataUri(svg);
}

function buildFallbackProfile(symbol: string, name: string): Omit<StockBrandProfile, "symbol"> {
  const seed = symbol.split("").reduce((total, character) => total * 33 + character.charCodeAt(0), 11);
  const hue = seed % 360;
  const monogram = createMonogram(name, symbol);
  const gradientFrom = `hsl(${hue} 68% 86%)`;
  const gradientTo = `hsl(${(hue + 28) % 360} 64% 72%)`;

  return {
    monogram,
    accent: `hsl(${hue} 62% 38%)`,
    accentSoft: `hsl(${hue} 44% 82%)`,
    gradientFrom,
    gradientTo,
    logoSrc: buildGeneratedLogo(monogram, gradientFrom, gradientTo),
    logoType: "generated",
    textColor: "#0F172A",
  };
}

export function getStockBrandProfile(stock: StockLookupItem): StockBrandProfile {
  const manifestProfile = LOGO_MANIFEST[stock.symbol];
  const familyProfile = BRAND_FAMILY_RULES.find((rule) =>
    rule.aliases.some((alias) => stock.name.includes(alias)),
  )?.profile;
  const exactProfile = STOCK_BRAND_MAP[stock.symbol];

  const baseProfile =
    exactProfile ?? familyProfile ?? buildFallbackProfile(stock.symbol, stock.name);

  const profile = manifestProfile
    ? {
        ...baseProfile,
        logoSrc: manifestProfile.logoSrc,
        logoType: "asset" as const,
      }
    : baseProfile;

  return {
    ...profile,
    symbol: stock.symbol,
    monogram: profile.monogram ?? createMonogram(stock.name, stock.symbol),
  };
}
