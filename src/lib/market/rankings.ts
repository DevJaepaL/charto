import { callKis } from "@/lib/market/kis-provider";
import { hasKisCredentials } from "@/lib/market/provider";
import { getFeaturedStocks, getStockBySymbol } from "@/lib/stock-master";
import type { MarketRankItem, MarketRankMode, MarketRankingResponse } from "@/lib/types";

const MARKET_PULSE_LIMIT = 10;

const rankingCache = new Map<
  MarketRankMode,
  {
    expiresAt: number;
    payload: MarketRankingResponse;
  }
>();

const rankingInflight = new Map<MarketRankMode, Promise<MarketRankingResponse>>();

const RANKING_LABELS: Record<MarketRankMode, string> = {
  volume: "금일 거래량 상위",
  value: "금일 거래대금 상위",
  marketCap: "시가총액 상위",
};

function getCachedRanking(mode: MarketRankMode) {
  const cached = rankingCache.get(mode);
  if (!cached) {
    return null;
  }

  if (cached.expiresAt <= Date.now()) {
    rankingCache.delete(mode);
    return null;
  }

  return cached.payload;
}

function buildDemoRanking(mode: MarketRankMode): MarketRankingResponse {
  return {
    mode,
    label: RANKING_LABELS[mode],
    source: "demo",
    items: getFeaturedStocks()
      .slice(0, MARKET_PULSE_LIMIT)
      .map((stock, index) => ({
        rank: index + 1,
        stock,
        price: 0,
        changePercent: 0,
        volume: 0,
        tradeValue: 0,
        marketCap: 0,
      })),
  };
}

async function requestKisVolumeLikeRanking(mode: Extract<MarketRankMode, "volume" | "value">) {
  const payload = (await callKis(
    "/uapi/domestic-stock/v1/quotations/volume-rank",
    "FHPST01710000",
    {
      FID_COND_MRKT_DIV_CODE: "J",
      FID_COND_SCR_DIV_CODE: "20171",
      FID_INPUT_ISCD: "0000",
      FID_DIV_CLS_CODE: "0",
      FID_BLNG_CLS_CODE: mode === "volume" ? "0" : "3",
      FID_TRGT_CLS_CODE: "111111111",
      FID_TRGT_EXLS_CLS_CODE: "000000",
      FID_INPUT_PRICE_1: "0",
      FID_INPUT_PRICE_2: "0",
      FID_VOL_CNT: "0",
      FID_INPUT_DATE_1: "0",
    },
  )) as {
    output?: Array<Record<string, string>>;
  };

  const items = (payload.output ?? []).reduce<MarketRankItem[]>((accumulator, entry, index) => {
      const symbol = entry.mksc_shrn_iscd?.trim();
      const stock = symbol ? getStockBySymbol(symbol) : null;

      if (!stock) {
        return accumulator;
      }

      accumulator.push({
        rank: Number(entry.data_rank ?? index + 1),
        stock,
        price: Number(entry.stck_prpr ?? 0),
        changePercent: Number(entry.prdy_ctrt ?? 0),
        volume: Number(entry.acml_vol ?? 0),
        tradeValue: Number(entry.acml_tr_pbmn ?? 0),
        marketCap: null,
      } satisfies MarketRankItem);

      return accumulator;
    }, []).slice(0, MARKET_PULSE_LIMIT);

  return {
    mode,
    label: RANKING_LABELS[mode],
    source: "kis",
    items,
  } satisfies MarketRankingResponse;
}

async function requestKisMarketCapRanking() {
  const payload = (await callKis(
    "/uapi/domestic-stock/v1/ranking/market-cap",
    "FHPST01740000",
    {
      fid_input_price_2: "",
      fid_cond_mrkt_div_code: "J",
      fid_cond_scr_div_code: "20174",
      fid_div_cls_code: "0",
      fid_input_iscd: "0000",
      fid_trgt_cls_code: "0",
      fid_trgt_exls_cls_code: "0",
      fid_input_price_1: "",
      fid_vol_cnt: "",
    },
  )) as {
    output?: Array<Record<string, string>>;
  };

  const items = (payload.output ?? []).reduce<MarketRankItem[]>((accumulator, entry, index) => {
      const symbol = entry.mksc_shrn_iscd?.trim();
      const stock = symbol ? getStockBySymbol(symbol) : null;

      if (!stock) {
        return accumulator;
      }

      accumulator.push({
        rank: Number(entry.data_rank ?? index + 1),
        stock,
        price: Number(entry.stck_prpr ?? 0),
        changePercent: Number(entry.prdy_ctrt ?? 0),
        volume: Number(entry.acml_vol ?? 0),
        tradeValue: 0,
        marketCap: Number(entry.stck_avls ?? 0),
      } satisfies MarketRankItem);

      return accumulator;
    }, []).slice(0, MARKET_PULSE_LIMIT);

  return {
    mode: "marketCap",
    label: RANKING_LABELS.marketCap,
    source: "kis",
    items,
  } satisfies MarketRankingResponse;
}

export async function loadMarketRanking(mode: MarketRankMode): Promise<MarketRankingResponse> {
  const cached = getCachedRanking(mode);
  if (cached) {
    return cached;
  }

  const inflight = rankingInflight.get(mode);
  if (inflight) {
    return inflight;
  }

  const request = (async () => {
    if (!hasKisCredentials()) {
      return buildDemoRanking(mode);
    }

    try {
      const payload =
        mode === "marketCap" ? await requestKisMarketCapRanking() : await requestKisVolumeLikeRanking(mode);

      rankingCache.set(mode, {
        expiresAt: Date.now() + 2 * 60_000,
        payload,
      });

      return payload;
    } catch {
      return buildDemoRanking(mode);
    }
  })().finally(() => {
    rankingInflight.delete(mode);
  });

  rankingInflight.set(mode, request);
  return request;
}
