import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

import { getCache } from "@vercel/functions";

import type { Candle, CandleInterval, CandleRange, QuoteSnapshot } from "@/lib/types";
import {
  candleLabelFromTimestamp,
  getDailyCandleCount,
  getIntradayDayCount,
  makeKstTimestamp,
  resampleCandles,
  resampleWeeklyCandles,
} from "@/lib/market/shared";
import type { MarketDataProvider, ProviderCandlePayload } from "@/lib/market/provider";

type KisSuccess<TOutput1 = Record<string, string>, TOutput2 = Array<Record<string, string>>> = {
  rt_cd: string;
  msg1: string;
  msg_cd: string;
  output1: TOutput1;
  output2: TOutput2;
};

type HistoricalPeriodCode = "D" | "W" | "M";

const KIS_REAL_BASE_URL = "https://openapi.koreainvestment.com:9443";
const KIS_VTS_BASE_URL = "https://openapivts.koreainvestment.com:29443";

let cachedToken:
  | {
      accessToken: string;
      expiresAt: number;
    }
  | undefined;
let inflightTokenRequest: Promise<string> | undefined;
const runtimeTokenCache = getCache({ namespace: "charto-kis-token" });

function getKisConfig() {
  const appKey = process.env.KIS_APP_KEY;
  const appSecret = process.env.KIS_APP_SECRET;

  if (!appKey || !appSecret) {
    throw new Error("KIS_APP_KEY와 KIS_APP_SECRET이 설정되지 않았습니다.");
  }

  const env = process.env.KIS_ENV === "demo" ? "demo" : "real";

  return {
    appKey,
    appSecret,
    baseUrl:
      process.env.KIS_BASE_URL ?? (env === "demo" ? KIS_VTS_BASE_URL : KIS_REAL_BASE_URL),
  };
}

function getTokenCacheFile(baseUrl: string, appKey: string) {
  if (process.env.KIS_TOKEN_CACHE_FILE) {
    return process.env.KIS_TOKEN_CACHE_FILE;
  }

  const keyHash = createHash("sha1").update(`${baseUrl}:${appKey}`).digest("hex").slice(0, 12);
  return path.join(os.tmpdir(), `charto-kis-token-${keyHash}.json`);
}

function getRuntimeTokenCacheKey(baseUrl: string, appKey: string) {
  return createHash("sha1").update(`${baseUrl}:${appKey}`).digest("hex");
}

function isTokenValid(token: { accessToken: string; expiresAt: number }, now = Date.now()) {
  return Boolean(token.accessToken) && token.expiresAt > now + 60_000;
}

function resolveTokenExpiry(
  payload: { expires_in?: number; access_token_token_expired?: string },
  now: number,
) {
  if (typeof payload.expires_in === "number" && payload.expires_in > 0) {
    return now + payload.expires_in * 1000;
  }

  if (payload.access_token_token_expired) {
    const normalized = payload.access_token_token_expired.replace(" ", "T");
    const parsed = Date.parse(normalized);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  return now + 21_600 * 1000;
}

async function readPersistedToken() {
  const { appKey, baseUrl } = getKisConfig();
  const tokenFile = getTokenCacheFile(baseUrl, appKey);

  try {
    const raw = await fs.readFile(tokenFile, "utf8");
    const parsed = JSON.parse(raw) as {
      accessToken?: string;
      expiresAt?: number;
      baseUrl?: string;
    };

    if (
      typeof parsed.accessToken !== "string" ||
      typeof parsed.expiresAt !== "number" ||
      parsed.baseUrl !== baseUrl
    ) {
      return null;
    }

    const persisted = {
      accessToken: parsed.accessToken,
      expiresAt: parsed.expiresAt,
    };

    return isTokenValid(persisted) ? persisted : null;
  } catch {
    return null;
  }
}

async function readRuntimeCachedToken() {
  const { appKey, baseUrl } = getKisConfig();
  const cacheKey = getRuntimeTokenCacheKey(baseUrl, appKey);

  try {
    const cached = (await runtimeTokenCache.get(cacheKey)) as
      | {
          accessToken?: string;
          expiresAt?: number;
          baseUrl?: string;
        }
      | null;

    if (
      !cached ||
      typeof cached.accessToken !== "string" ||
      typeof cached.expiresAt !== "number" ||
      cached.baseUrl !== baseUrl
    ) {
      return null;
    }

    const token = {
      accessToken: cached.accessToken,
      expiresAt: cached.expiresAt,
    };

    return isTokenValid(token) ? token : null;
  } catch {
    return null;
  }
}

async function writePersistedToken(token: { accessToken: string; expiresAt: number }) {
  const { appKey, baseUrl } = getKisConfig();
  const tokenFile = getTokenCacheFile(baseUrl, appKey);

  try {
    await fs.writeFile(
      tokenFile,
      JSON.stringify({
        accessToken: token.accessToken,
        expiresAt: token.expiresAt,
        baseUrl,
      }),
      "utf8",
    );
  } catch {
    // Token persistence is best-effort; runtime cache still works without it.
  }
}

async function writeRuntimeCachedToken(token: { accessToken: string; expiresAt: number }) {
  const { appKey, baseUrl } = getKisConfig();
  const cacheKey = getRuntimeTokenCacheKey(baseUrl, appKey);
  const ttlSeconds = Math.max(60, Math.floor((token.expiresAt - Date.now()) / 1000));

  try {
    await runtimeTokenCache.set(
      cacheKey,
      {
        accessToken: token.accessToken,
        expiresAt: token.expiresAt,
        baseUrl,
      },
      {
        ttl: ttlSeconds,
        name: "KIS access token",
      },
    );
  } catch {
    // Runtime cache is best-effort; other caches still exist.
  }
}

async function clearPersistedToken() {
  const { appKey, baseUrl } = getKisConfig();
  const tokenFile = getTokenCacheFile(baseUrl, appKey);

  try {
    await fs.unlink(tokenFile);
  } catch {
    // ignore missing cache file
  }
}

async function clearRuntimeCachedToken() {
  const { appKey, baseUrl } = getKisConfig();
  const cacheKey = getRuntimeTokenCacheKey(baseUrl, appKey);

  try {
    await runtimeTokenCache.delete(cacheKey);
  } catch {
    // ignore cache deletion failures
  }
}

async function getAccessToken() {
  const now = Date.now();
  if (cachedToken && isTokenValid(cachedToken, now)) {
    return cachedToken.accessToken;
  }

  const runtimeToken = await readRuntimeCachedToken();
  if (runtimeToken) {
    cachedToken = runtimeToken;
    return runtimeToken.accessToken;
  }

  const persistedToken = await readPersistedToken();
  if (persistedToken) {
    cachedToken = persistedToken;
    return persistedToken.accessToken;
  }

  if (inflightTokenRequest) {
    return inflightTokenRequest;
  }

  const { appKey, appSecret, baseUrl } = getKisConfig();
  const request = (async () => {
    const response = await fetch(`${baseUrl}/oauth2/tokenP`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "text/plain",
      },
      body: JSON.stringify({
        grant_type: "client_credentials",
        appkey: appKey,
        appsecret: appSecret,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      const runtimeFallbackToken = await readRuntimeCachedToken();
      if (runtimeFallbackToken) {
        cachedToken = runtimeFallbackToken;
        return runtimeFallbackToken.accessToken;
      }

      const fallbackToken = await readPersistedToken();
      if (fallbackToken) {
        cachedToken = fallbackToken;
        return fallbackToken.accessToken;
      }

      throw new Error(`토큰 발급에 실패했습니다. (${response.status})`);
    }

    const payload = (await response.json()) as {
      access_token: string;
      expires_in?: number;
      access_token_token_expired?: string;
    };

    cachedToken = {
      accessToken: payload.access_token,
      expiresAt: resolveTokenExpiry(payload, now),
    };

    await Promise.allSettled([writeRuntimeCachedToken(cachedToken), writePersistedToken(cachedToken)]);
    return payload.access_token;
  })().finally(() => {
    inflightTokenRequest = undefined;
  });

  inflightTokenRequest = request;
  return request;
}

async function requestKis<TOutput1 = Record<string, string>, TOutput2 = Array<Record<string, string>>>(
  token: string,
  path: string,
  trId: string,
  params: Record<string, string>,
) {
  const { appKey, appSecret, baseUrl } = getKisConfig();
  const url = new URL(`${baseUrl}${path}`);

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url, {
    headers: {
      authorization: `Bearer ${token}`,
      appkey: appKey,
      appsecret: appSecret,
      tr_id: trId,
      custtype: "P",
      accept: "application/json",
      "content-type": "application/json; charset=utf-8",
    },
    cache: "no-store",
  });

  const payload = (await response.json()) as KisSuccess<TOutput1, TOutput2>;

  return {
    response,
    payload,
  };
}

export async function callKis<
  TOutput1 = Record<string, string>,
  TOutput2 = Array<Record<string, string>>,
>(
  path: string,
  trId: string,
  params: Record<string, string>,
) {
  const firstToken = await getAccessToken();
  let { response, payload } = await requestKis<TOutput1, TOutput2>(firstToken, path, trId, params);

  const authFailed =
    response.status === 401 ||
    response.status === 403 ||
    payload.msg1?.includes("토큰") ||
    payload.msg_cd?.startsWith("EGW");

  if ((!response.ok || payload.rt_cd !== "0") && authFailed) {
    cachedToken = undefined;
    inflightTokenRequest = undefined;
    await Promise.allSettled([clearRuntimeCachedToken(), clearPersistedToken()]);

    const retryToken = await getAccessToken();
    const retryResult = await requestKis<TOutput1, TOutput2>(retryToken, path, trId, params);
    response = retryResult.response;
    payload = retryResult.payload;
  }

  if (!response.ok || payload.rt_cd !== "0") {
    throw new Error(payload.msg1 || `KIS 호출 실패 (${response.status})`);
  }

  return payload;
}

function getDateWindow(range: CandleRange) {
  const end = new Date();
  const start = new Date(end);

  switch (range) {
    case "1d":
      start.setDate(end.getDate() - 2);
      break;
    case "1w":
      start.setDate(end.getDate() - 9);
      break;
    case "1mo":
      start.setMonth(end.getMonth() - 1);
      break;
    case "3mo":
      start.setMonth(end.getMonth() - 3);
      break;
    case "6mo":
      start.setMonth(end.getMonth() - 6);
      break;
    case "1y":
      start.setFullYear(end.getFullYear() - 1);
      break;
    case "3y":
      start.setFullYear(end.getFullYear() - 3);
      break;
    case "5y":
      start.setFullYear(end.getFullYear() - 5);
      break;
    case "max":
      start.setFullYear(1980, 0, 1);
      break;
  }

  return { start, end };
}

function formatKisDate(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}${month}${day}`;
}

function candleFromKisDaily(row: Record<string, string>): Candle | null {
  const date = row.stck_bsop_date;
  if (!date) {
    return null;
  }

  const time = makeKstTimestamp(
    Number(date.slice(0, 4)),
    Number(date.slice(4, 6)) - 1,
    Number(date.slice(6, 8)),
    15,
    30,
  );

  return {
    time,
    label: candleLabelFromTimestamp(time, false),
    open: Number(row.stck_oprc ?? 0),
    high: Number(row.stck_hgpr ?? 0),
    low: Number(row.stck_lwpr ?? 0),
    close: Number(row.stck_clpr ?? row.stck_prpr ?? 0),
    volume: Number(row.acml_vol ?? 0),
  };
}

function candleFromKisMinute(row: Record<string, string>): Candle | null {
  const date = row.stck_bsop_date;
  const hour = row.stck_cntg_hour;
  if (!date || !hour) {
    return null;
  }

  const time = makeKstTimestamp(
    Number(date.slice(0, 4)),
    Number(date.slice(4, 6)) - 1,
    Number(date.slice(6, 8)),
    Number(hour.slice(0, 2)),
    Number(hour.slice(2, 4)),
    Number(hour.slice(4, 6)),
  );

  return {
    time,
    label: candleLabelFromTimestamp(time, true),
    open: Number(row.stck_oprc ?? 0),
    high: Number(row.stck_hgpr ?? 0),
    low: Number(row.stck_lwpr ?? 0),
    close: Number(row.stck_prpr ?? 0),
    volume: Number(row.cntg_vol ?? 0),
  };
}

function quoteFromCurrent(output1: Record<string, string>): QuoteSnapshot {
  const currentPrice = Number(output1.stck_prpr ?? 0);
  const previousClose = Number(output1.stck_sdpr ?? 0);

  return {
    currentPrice,
    previousClose,
    change: Number(output1.prdy_vrss ?? currentPrice - previousClose),
    changePercent: Number(output1.prdy_ctrt ?? 0),
    open: Number(output1.stck_oprc ?? 0),
    high: Number(output1.stck_hgpr ?? 0),
    low: Number(output1.stck_lwpr ?? 0),
    volume: Number(output1.acml_vol ?? 0),
  };
}

function quoteFromCandles(candles: Candle[]): QuoteSnapshot {
  const latest = candles.at(-1) ?? candles[0];
  const previous = candles.at(-2) ?? latest;

  return {
    currentPrice: latest.close,
    previousClose: previous.close,
    change: latest.close - previous.close,
    changePercent:
      previous.close === 0 ? 0 : ((latest.close - previous.close) / previous.close) * 100,
    open: latest.open,
    high: latest.high,
    low: latest.low,
    volume: latest.volume,
  };
}

async function getCurrentQuote(symbol: string) {
  const payload = await callKis<Record<string, string>, Array<Record<string, string>>>(
    "/uapi/domestic-stock/v1/quotations/inquire-price",
    "FHKST01010100",
    {
      fid_cond_mrkt_div_code: "J",
      fid_input_iscd: symbol,
    },
  );

  return quoteFromCurrent(payload.output1);
}

export async function getKisCurrentQuoteOrNull(symbol: string) {
  return getCurrentQuote(symbol).catch(() => null);
}

function moveDateByDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function moveDateByMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function moveDateByYears(date: Date, years: number) {
  const next = new Date(date);
  next.setFullYear(next.getFullYear() + years);
  return next;
}

function normalizeCandles(candles: Candle[]) {
  return [...new Map(candles.map((candle) => [candle.time, candle])).values()].sort(
    (left, right) => left.time - right.time,
  );
}

async function getPeriodCandles(
  symbol: string,
  startDate: string,
  endDate: string,
  periodCode: HistoricalPeriodCode,
  targetCount?: number,
) {
  let currentEnd = endDate;
  const candles: Candle[] = [];

  while (true) {
    const payload = await callKis(
      "/uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice",
      "FHKST03010100",
      {
        FID_COND_MRKT_DIV_CODE: "J",
        FID_INPUT_ISCD: symbol,
        FID_INPUT_DATE_1: startDate,
        FID_INPUT_DATE_2: currentEnd,
        FID_PERIOD_DIV_CODE: periodCode,
        FID_ORG_ADJ_PRC: "0",
      },
    );

    const rows = payload.output2.map(candleFromKisDaily).filter(Boolean) as Candle[];
    if (!rows.length) {
      break;
    }

    candles.push(...rows);
    const lastDate = payload.output2.at(-1)?.stck_bsop_date;

    if (
      !lastDate ||
      rows.length < 100 ||
      lastDate <= startDate ||
      (targetCount !== undefined && candles.length >= targetCount)
    ) {
      break;
    }

    const cursor = new Date(
      Number(lastDate.slice(0, 4)),
      Number(lastDate.slice(4, 6)) - 1,
      Number(lastDate.slice(6, 8)),
    );
    cursor.setDate(cursor.getDate() - 1);
    currentEnd = formatKisDate(cursor);
  }

  const normalized = normalizeCandles(candles);

  return targetCount !== undefined ? normalized.slice(-targetCount) : normalized;
}

async function getCompressedMaxCandles(
  symbol: string,
  interval: Extract<CandleInterval, "1d" | "1w">,
): Promise<{ candles: Candle[]; notice?: string }> {
  const today = new Date();
  const weeklyStart = moveDateByYears(today, -5);
  const monthlyEnd = moveDateByDays(weeklyStart, -1);
  const notice =
    interval === "1d"
      ? "전체 기간은 최근 6개월 일봉, 최근 5년 주봉, 그 이전 월봉을 함께 압축해 표시합니다."
      : "전체 기간은 최근 5년 주봉과 그 이전 월봉을 함께 압축해 표시합니다.";

  if (interval === "1w") {
    const [olderMonthly, recentWeekly] = await Promise.all([
      getPeriodCandles(symbol, "19800101", formatKisDate(monthlyEnd), "M"),
      getPeriodCandles(symbol, formatKisDate(weeklyStart), formatKisDate(today), "W"),
    ]);

    return {
      notice,
      candles: normalizeCandles([...olderMonthly, ...recentWeekly]),
    };
  }

  const dailyStart = moveDateByMonths(today, -6);
  const weeklyEnd = moveDateByDays(dailyStart, -1);
  const [olderMonthly, middleWeekly, recentDaily] = await Promise.all([
    getPeriodCandles(symbol, "19800101", formatKisDate(monthlyEnd), "M"),
    getPeriodCandles(symbol, formatKisDate(weeklyStart), formatKisDate(weeklyEnd), "W"),
    getPeriodCandles(symbol, formatKisDate(dailyStart), formatKisDate(today), "D"),
  ]);

  return {
    notice,
    candles: normalizeCandles([...olderMonthly, ...middleWeekly, ...recentDaily]),
  };
}

async function getDailyCandles(
  symbol: string,
  interval: CandleInterval,
  range: CandleRange,
): Promise<{ candles: Candle[]; notice?: string }> {
  if (range === "max" && (interval === "1d" || interval === "1w")) {
    return getCompressedMaxCandles(symbol, interval);
  }

  const { start, end } = getDateWindow(range);
  const normalized = await getPeriodCandles(
    symbol,
    formatKisDate(start),
    formatKisDate(end),
    "D",
    getDailyCandleCount(range),
  );

  return {
    candles: interval === "1w" ? resampleWeeklyCandles(normalized) : normalized,
  };
}

async function getIntradayCandles(symbol: string, range: CandleRange) {
  const tradingDays = Math.min(getIntradayDayCount(range), 5);
  const notice =
    range === "1mo" || range === "3mo" || range === "6mo" || range === "1y"
      ? "한국투자 분봉 API 한계로 최근 1주 범위까지만 제공합니다."
      : undefined;

  const candles: Candle[] = [];
  const cursor = new Date();
  let fetchedDays = 0;
  let attempts = 0;

  while (fetchedDays < tradingDays && attempts < 14) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) {
      const dayDate = formatKisDate(cursor);
      let currentHour = "153000";
      const dayCandles: Candle[] = [];
      let page = 0;

      while (page < 12) {
        const payload = await callKis(
          "/uapi/domestic-stock/v1/quotations/inquire-time-dailychartprice",
          "FHKST03010230",
          {
            FID_COND_MRKT_DIV_CODE: "J",
            FID_INPUT_ISCD: symbol,
            FID_INPUT_HOUR_1: currentHour,
            FID_INPUT_DATE_1: dayDate,
            FID_PW_DATA_INCU_YN: "Y",
            FID_FAKE_TICK_INCU_YN: "",
          },
        );

        const rows = payload.output2.map(candleFromKisMinute).filter(Boolean) as Candle[];
        if (!rows.length) {
          break;
        }

        dayCandles.push(...rows);
        const earliest = payload.output2
          .map((entry) => entry.stck_cntg_hour)
          .filter(Boolean)
          .sort()[0];

        if (!earliest || earliest <= "090000" || rows.length < 120) {
          break;
        }

        currentHour = earliest;
        page += 1;
      }

      if (dayCandles.length) {
        candles.push(...dayCandles);
        fetchedDays += 1;
      }
    }

    cursor.setDate(cursor.getDate() - 1);
    attempts += 1;
  }

  return {
    notice,
    candles: candles.sort((left, right) => left.time - right.time),
  };
}

export class KisMarketDataProvider implements MarketDataProvider {
  providerId = "kis" as const;

  async getCandles(
    symbol: string,
    interval: CandleInterval,
    range: CandleRange,
  ): Promise<ProviderCandlePayload> {
    if (interval === "1d" || interval === "1w") {
      const [{ candles, notice }, quote] = await Promise.all([
        getDailyCandles(symbol, interval, range),
        getCurrentQuote(symbol).catch(() => null),
      ]);

      return {
        provider: this.providerId,
        isDemo: false,
        notice,
        candles,
        quote: quote ?? quoteFromCandles(candles),
      };
    }

    const { notice, candles: minuteCandles } = await getIntradayCandles(symbol, range);
    const intervalMinutes = Number.parseInt(interval, 10);
    const candles = resampleCandles(minuteCandles, intervalMinutes);
    const quote = await getCurrentQuote(symbol).catch(() => quoteFromCandles(candles));

    return {
      provider: this.providerId,
      isDemo: false,
      notice,
      candles,
      quote,
    };
  }
}
