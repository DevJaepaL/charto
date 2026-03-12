import AdmZip from "adm-zip";

import generatedCompanyContextManifest from "@/data/company-context.generated.json";
import generatedDartCorpCodesManifest from "@/data/dart-corp-codes.generated.json";
import {
  buildOfficialContextFromIndustryCode,
  inferCompanyContext,
  inferInstrumentProfile,
  mergeCompanyContexts,
} from "@/lib/analysis/company-context";
import type { CompanyContext, StockLookupItem } from "@/lib/types";

const DART_CORP_CODE_URL = "https://opendart.fss.or.kr/api/corpCode.xml";
const DART_COMPANY_URL = "https://opendart.fss.or.kr/api/company.json";
const DART_CORP_CODES_TTL_MS = 24 * 60 * 60 * 1000;
const DART_COMPANY_INFO_TTL_MS = 24 * 60 * 60 * 1000;
const DART_FAILURE_BACKOFF_MS = 10 * 60 * 1000;

type DartCompanyResponse = {
  status?: string;
  message?: string;
  induty_code?: string;
  corp_cls?: string;
};

type GeneratedCompanyContextEntry = {
  corpCode?: string;
  indutyCode?: string;
  corpCls?: string | null;
  corpName?: string | null;
  updatedAt?: string;
};

type GeneratedCompanyContextManifest = {
  generatedAt?: string;
  source?: string;
  items?: Record<string, GeneratedCompanyContextEntry>;
};

type GeneratedDartCorpCodeManifest = {
  generatedAt?: string;
  source?: string;
  items?: Record<string, string>;
};

const generatedCompanyContextItems =
  ((generatedCompanyContextManifest as GeneratedCompanyContextManifest).items ?? {}) satisfies Record<
    string,
    GeneratedCompanyContextEntry
  >;
const generatedDartCorpCodeItems =
  ((generatedDartCorpCodesManifest as GeneratedDartCorpCodeManifest).items ?? {}) satisfies Record<
    string,
    string
  >;

let corpCodeCache: { expiresAt: number; map: Map<string, string> } | null = null;
let corpCodeRequest: Promise<Map<string, string>> | null = null;
const companyInfoCache = new Map<string, { expiresAt: number; payload: DartCompanyResponse | null }>();
const companyInfoRequests = new Map<string, Promise<DartCompanyResponse | null>>();
let dartLookupUnavailableUntil = 0;

function extractXmlTagValue(block: string, tagName: string) {
  const match = block.match(new RegExp(`<${tagName}>([\\s\\S]*?)</${tagName}>`));
  return match?.[1]?.trim() ?? "";
}

function parseDartCorpCodeXml(xml: string) {
  const map = new Map<string, string>();

  for (const match of xml.matchAll(/<list>([\s\S]*?)<\/list>/g)) {
    const block = match[1];
    const stockCode = extractXmlTagValue(block, "stock_code");
    const corpCode = extractXmlTagValue(block, "corp_code");

    if (!stockCode || !corpCode || !/^\d{6}$/.test(stockCode)) {
      continue;
    }

    map.set(stockCode, corpCode);
  }

  return map;
}

function getOpenDartApiKey() {
  return (
    process.env.OPENDART_API_KEY?.trim() ||
    process.env.OPEN_DART_API_KEY?.trim() ||
    process.env.DART_API_KEY?.trim() ||
    ""
  );
}

async function fetchDartCorpCodes(apiKey: string) {
  if (corpCodeCache && corpCodeCache.expiresAt > Date.now()) {
    return corpCodeCache.map;
  }

  if (corpCodeRequest) {
    return corpCodeRequest;
  }

  corpCodeRequest = (async () => {
    const response = await fetch(
      `${DART_CORP_CODE_URL}?crtfc_key=${encodeURIComponent(apiKey)}`,
      { next: { revalidate: 86_400 } },
    );

    if (!response.ok) {
      throw new Error(`DART corpCode 조회 실패 (${response.status})`);
    }

    const zipBuffer = Buffer.from(await response.arrayBuffer());
    const zip = new AdmZip(zipBuffer);
    const entry = zip
      .getEntries()
      .find((candidate) => candidate.entryName.toLowerCase().endsWith("corpcode.xml"));

    if (!entry) {
      throw new Error("DART corpCode.xml 응답을 해석하지 못했습니다.");
    }

    const map = parseDartCorpCodeXml(entry.getData().toString("utf8"));

    corpCodeCache = {
      expiresAt: Date.now() + DART_CORP_CODES_TTL_MS,
      map,
    };

    return map;
  })().finally(() => {
    corpCodeRequest = null;
  });

  return corpCodeRequest;
}

async function fetchDartCompanyInfo(apiKey: string, corpCode: string) {
  const cached = companyInfoCache.get(corpCode);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.payload;
  }

  const inflight = companyInfoRequests.get(corpCode);
  if (inflight) {
    return inflight;
  }

  const request = (async () => {
    const response = await fetch(
      `${DART_COMPANY_URL}?crtfc_key=${encodeURIComponent(apiKey)}&corp_code=${encodeURIComponent(corpCode)}`,
      { next: { revalidate: 86_400 } },
    );

    if (!response.ok) {
      throw new Error(`DART company 조회 실패 (${response.status})`);
    }

    const payload = (await response.json()) as DartCompanyResponse;
    if (payload.status !== "000") {
      companyInfoCache.set(corpCode, {
        expiresAt: Date.now() + DART_COMPANY_INFO_TTL_MS,
        payload: null,
      });
      return null;
    }

    companyInfoCache.set(corpCode, {
      expiresAt: Date.now() + DART_COMPANY_INFO_TTL_MS,
      payload,
    });

    return payload;
  })().finally(() => {
    companyInfoRequests.delete(corpCode);
  });

  companyInfoRequests.set(corpCode, request);
  return request;
}

function getGeneratedCompanyContextEntry(symbol: string) {
  const entry = generatedCompanyContextItems[symbol];
  if (!entry?.indutyCode?.trim()) {
    return null;
  }

  return {
    ...entry,
    indutyCode: entry.indutyCode.trim(),
  };
}

function getGeneratedCorpCode(symbol: string) {
  const corpCode = generatedDartCorpCodeItems[symbol]?.trim();
  return corpCode || null;
}

export async function resolveCompanyContext(stock: StockLookupItem): Promise<CompanyContext> {
  const inferred = inferCompanyContext(stock);
  const profile = inferInstrumentProfile(stock);

  if (profile.isExchangeTradedProduct) {
    return inferred;
  }

  const generatedEntry = getGeneratedCompanyContextEntry(stock.symbol);
  if (generatedEntry) {
    const official = buildOfficialContextFromIndustryCode(stock, profile, generatedEntry.indutyCode);
    return mergeCompanyContexts(inferred, official);
  }

  if (dartLookupUnavailableUntil > Date.now()) {
    return inferred;
  }

  const apiKey = getOpenDartApiKey();
  if (!apiKey) {
    return inferred;
  }

  try {
    const corpCode =
      getGeneratedCorpCode(stock.symbol) ??
      (await fetchDartCorpCodes(apiKey)).get(stock.symbol) ??
      null;
    if (!corpCode) {
      return inferred;
    }

    const companyInfo = await fetchDartCompanyInfo(apiKey, corpCode);
    const indutyCode = companyInfo?.induty_code?.trim();
    if (!indutyCode) {
      return inferred;
    }

    const official = buildOfficialContextFromIndustryCode(stock, profile, indutyCode);
    return mergeCompanyContexts(inferred, official);
  } catch {
    dartLookupUnavailableUntil = Date.now() + DART_FAILURE_BACKOFF_MS;
    return inferred;
  }
}
