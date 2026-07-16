import type { TossOAuth2TokenResponse } from "@/lib/toss/types";

const TOSS_BASE_URL = process.env.TOSS_BASE_URL ?? "https://openapi.tossinvest.com";
const DEFAULT_CLIENT_ID = "tsck_live_qkGDnlLUEZNn57jKyOYQFA";

/** 토큰 만료 60초 전에 미리 재발급한다. */
const TOKEN_EXPIRY_MARGIN_MS = 60_000;

export class TossApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string | null = null,
    readonly requestId: string | null = null,
  ) {
    super(message);
    this.name = "TossApiError";
  }
}

export function getTossClientId() {
  return process.env.TOSS_CLIENT_ID?.trim() || DEFAULT_CLIENT_ID;
}

export function hasTossCredentials() {
  return Boolean(getTossClientId() && process.env.TOSS_CLIENT_SECRET?.trim());
}

interface CachedToken {
  accessToken: string;
  expiresAt: number;
}

let tokenCache: CachedToken | null = null;
let tokenRequest: Promise<CachedToken> | null = null;

async function issueToken(): Promise<CachedToken> {
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: getTossClientId(),
    client_secret: process.env.TOSS_CLIENT_SECRET?.trim() ?? "",
  });

  const response = await fetch(`${TOSS_BASE_URL}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new TossApiError(
      `토스증권 토큰 발급 실패 (HTTP ${response.status}) ${detail.slice(0, 200)}`,
      response.status,
    );
  }

  const payload = (await response.json()) as TossOAuth2TokenResponse;

  return {
    accessToken: payload.access_token,
    expiresAt: Date.now() + payload.expires_in * 1000 - TOKEN_EXPIRY_MARGIN_MS,
  };
}

async function getAccessToken(): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now()) {
    return tokenCache.accessToken;
  }

  if (!tokenRequest) {
    tokenRequest = issueToken().finally(() => {
      tokenRequest = null;
    });
  }

  tokenCache = await tokenRequest;
  return tokenCache.accessToken;
}

/** 테스트 전용: 모듈 상태 초기화 */
export function resetTossClientStateForTest() {
  tokenCache = null;
  tokenRequest = null;
  lastRequestAt.clear();
}

/**
 * Rate limit 그룹별 최소 요청 간격(ms).
 * 문서 기준 한도의 절반 수준으로 보수적으로 잡는다.
 */
const GROUP_MIN_INTERVAL_MS: Record<string, number> = {
  MARKET_DATA: 120,
  MARKET_DATA_CHART: 220,
  RANKING: 220,
  MARKET_INDICATOR: 120,
  MARKET_INFO: 350,
  STOCK: 220,
};

const lastRequestAt = new Map<string, number>();

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function throttle(group: string) {
  const minInterval = GROUP_MIN_INTERVAL_MS[group] ?? 200;
  const now = Date.now();
  const previous = lastRequestAt.get(group) ?? 0;
  const wait = previous + minInterval - now;
  lastRequestAt.set(group, Math.max(now, previous + minInterval));

  if (wait > 0) {
    await sleep(wait);
  }
}

interface TossErrorEnvelope {
  error?: {
    requestId?: string;
    code?: string;
    message?: string;
  };
}

export interface TossRequestOptions {
  /** rate limit 그룹 (스로틀 키) */
  group: string;
  searchParams?: Record<string, string | number | boolean | undefined>;
}

/**
 * 토스증권 API GET 요청. 성공 envelope `{ result }`을 언랩해 반환한다.
 * 429는 Retry-After를 존중해 1회 재시도한다.
 */
export async function tossGet<T>(path: string, options: TossRequestOptions): Promise<T> {
  if (!hasTossCredentials()) {
    throw new TossApiError("토스증권 API 자격증명이 없습니다 (TOSS_CLIENT_SECRET 미설정)", 0, "missing-credentials");
  }

  const url = new URL(path, TOSS_BASE_URL);
  for (const [key, value] of Object.entries(options.searchParams ?? {})) {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  }

  for (let attempt = 0; ; attempt += 1) {
    await throttle(options.group);
    const token = await getAccessToken();

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (response.status === 429 && attempt === 0) {
      const retryAfter = Number(response.headers.get("Retry-After") ?? "1");
      await sleep(Math.min(Math.max(retryAfter, 1), 5) * 1000);
      continue;
    }

    if (response.status === 401 && attempt === 0) {
      // 토큰 만료/무효 — 캐시를 비우고 한 번 재발급해 재시도
      tokenCache = null;
      continue;
    }

    if (!response.ok) {
      const envelope = (await response.json().catch(() => ({}))) as TossErrorEnvelope;
      throw new TossApiError(
        envelope.error?.message ?? `토스증권 API 오류 (HTTP ${response.status})`,
        response.status,
        envelope.error?.code ?? null,
        envelope.error?.requestId ?? null,
      );
    }

    const payload = (await response.json()) as { result: T };
    return payload.result;
  }
}
