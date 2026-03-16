import generatedCompanyContextManifest from "@/data/company-context.generated.json";
import { inferInstrumentProfile } from "@/lib/analysis/company-context";
import type {
  CompanyContext,
  EarningsContext,
  EarningsDisclosureItem,
  EarningsDisclosureKind,
  StockLookupItem,
} from "@/lib/types";

type GeneratedCompanyContextEntry = {
  corpCode?: string;
};

type GeneratedCompanyContextManifest = {
  items?: Record<string, GeneratedCompanyContextEntry>;
};

type DartDisclosure = {
  report_nm?: string;
  rcept_dt?: string;
  rcept_no?: string;
};

type DartListResponse = {
  status?: string;
  message?: string;
  list?: DartDisclosure[];
};

const generatedCompanyContextItems =
  ((generatedCompanyContextManifest as GeneratedCompanyContextManifest).items ?? {}) satisfies Record<
    string,
    GeneratedCompanyContextEntry
  >;

const earningsContextCache = new Map<
  string,
  {
    expiresAt: number;
    value: EarningsContext | null;
  }
>();
const earningsContextInflight = new Map<string, Promise<EarningsContext | null>>();

const EARNINGS_CONTEXT_TTL_MS = 6 * 60 * 60 * 1000;
const DART_TIMEOUT_MS = 5000;

const EARNINGS_PATTERNS = [
  /영업\(잠정\)실적/u,
  /매출액또는손익구조/u,
  /연결재무제표/u,
  /분기보고서/u,
  /반기보고서/u,
  /사업보고서/u,
  /감사보고서/u,
];

const GUIDANCE_PATTERNS = [
  /기업설명회/u,
  /\bIR\b/i,
  /실적발표/u,
  /가이던스/u,
  /전망/u,
  /수주/u,
  /투자판단관련주요경영사항/u,
  /현황/u,
];

function getCorpCode(symbol: string) {
  return generatedCompanyContextItems[symbol]?.corpCode?.trim() ?? "";
}

function formatDisclosureDate(value: string | undefined) {
  const date = (value ?? "").trim();
  if (!/^\d{8}$/.test(date)) {
    return date;
  }

  return `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;
}

function buildDisclosureUrl(receiptNo: string | undefined) {
  const rceptNo = (receiptNo ?? "").trim();
  if (!rceptNo) {
    return "";
  }

  return `https://dart.fss.or.kr/dsaf001/main.do?rcpNo=${rceptNo}`;
}

export function classifyDisclosureKind(title: string): EarningsDisclosureKind {
  if (EARNINGS_PATTERNS.some((pattern) => pattern.test(title))) {
    return "earnings";
  }

  if (/기업설명회/u.test(title) || /\bIR\b/i.test(title)) {
    return "ir";
  }

  if (GUIDANCE_PATTERNS.some((pattern) => pattern.test(title))) {
    return "guidance";
  }

  return "filing";
}

function mapDisclosureItem(item: DartDisclosure): EarningsDisclosureItem | null {
  const title = item.report_nm?.trim() ?? "";
  const date = formatDisclosureDate(item.rcept_dt);
  if (!title || !date) {
    return null;
  }

  return {
    date,
    title,
    url: buildDisclosureUrl(item.rcept_no),
    kind: classifyDisclosureKind(title),
  };
}

export function summarizeEarningsContext(
  companyContext: CompanyContext,
  latest: EarningsDisclosureItem | null,
  earnings: EarningsDisclosureItem | null,
  guidance: EarningsDisclosureItem | null,
): EarningsContext {
  const summary = earnings
    ? `최근 실적 공시는 ${earnings.date} ${earnings.title}입니다.`
    : latest
      ? `최근 확인된 공시는 ${latest.date} ${latest.title}입니다.`
      : "최근 1년 내 실적 성격 공시는 뚜렷하게 확인되지 않았습니다.";

  const outlook = guidance
    ? `가장 가까운 IR·전망 공시는 ${guidance.date} ${guidance.title}입니다.`
    : `${companyContext.sector} 업종은 ${companyContext.industryFlow}`;

  return {
    available: Boolean(latest || earnings || guidance),
    latest,
    earnings,
    guidance,
    summary,
    outlook,
  };
}

async function fetchDartDisclosureList(corpCode: string) {
  const apiKey = process.env.OPENDART_API_KEY?.trim() ?? "";
  if (!apiKey || !corpCode) {
    return [];
  }

  const end = new Date();
  const start = new Date();
  start.setFullYear(end.getFullYear() - 1);

  const searchParams = new URLSearchParams({
    crtfc_key: apiKey,
    corp_code: corpCode,
    bgn_de: `${start.getFullYear()}${`${start.getMonth() + 1}`.padStart(2, "0")}${`${start.getDate()}`.padStart(2, "0")}`,
    end_de: `${end.getFullYear()}${`${end.getMonth() + 1}`.padStart(2, "0")}${`${end.getDate()}`.padStart(2, "0")}`,
    last_reprt_at: "Y",
    page_count: "20",
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DART_TIMEOUT_MS);

  try {
    const response = await fetch(`https://opendart.fss.or.kr/api/list.json?${searchParams.toString()}`, {
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Open DART list 호출 실패 (${response.status})`);
    }

    const payload = (await response.json()) as DartListResponse;
    if (payload.status !== "000" && payload.status !== "013") {
      throw new Error(payload.message || "Open DART list 응답 오류");
    }

    return (payload.list ?? [])
      .map(mapDisclosureItem)
      .filter(Boolean) as EarningsDisclosureItem[];
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function resolveEarningsContext(
  stock: StockLookupItem,
  companyContext: CompanyContext,
): Promise<EarningsContext | null> {
  const profile = inferInstrumentProfile(stock);
  if (profile.isExchangeTradedProduct) {
    return null;
  }

  const cacheKey = stock.symbol;
  const cached = earningsContextCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const inflight = earningsContextInflight.get(cacheKey);
  if (inflight) {
    return inflight;
  }

  const request = (async () => {
    const corpCode = getCorpCode(stock.symbol);
    if (!corpCode) {
      return null;
    }

    try {
      const disclosures = await fetchDartDisclosureList(corpCode);
      const latest = disclosures[0] ?? null;
      const earnings = disclosures.find((item) => item.kind === "earnings") ?? null;
      const guidance =
        disclosures.find((item) => item.kind === "guidance" || item.kind === "ir") ?? null;

      return summarizeEarningsContext(companyContext, latest, earnings, guidance);
    } catch {
      return null;
    }
  })()
    .then((value) => {
      earningsContextCache.set(cacheKey, {
        expiresAt: Date.now() + EARNINGS_CONTEXT_TTL_MS,
        value,
      });
      return value;
    })
    .finally(() => {
      earningsContextInflight.delete(cacheKey);
    });

  earningsContextInflight.set(cacheKey, request);
  return request;
}
