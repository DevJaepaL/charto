import generatedCompanyContextManifest from "@/data/company-context.generated.json";
import {
  buildOfficialContextFromIndustryCode,
  inferCompanyContext,
  inferInstrumentProfile,
  mergeCompanyContexts,
} from "@/lib/analysis/company-context";
import type { CompanyContext, StockLookupItem } from "@/lib/types";

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

const generatedCompanyContextItems =
  ((generatedCompanyContextManifest as GeneratedCompanyContextManifest).items ?? {}) satisfies Record<
    string,
    GeneratedCompanyContextEntry
  >;
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

  return inferred;
}
