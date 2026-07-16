import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { hasTossCredentials, resetTossClientStateForTest, TossApiError, tossGet } from "@/lib/toss/client";

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

const TOKEN_RESPONSE = {
  access_token: "test-token",
  token_type: "Bearer",
  expires_in: 86400,
};

describe("toss client", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    resetTossClientStateForTest();
    vi.stubEnv("TOSS_CLIENT_SECRET", "test-secret");
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("자격증명이 없으면 즉시 실패한다", async () => {
    vi.stubEnv("TOSS_CLIENT_SECRET", "");
    expect(hasTossCredentials()).toBe(false);
    await expect(tossGet("/api/v1/prices", { group: "MARKET_DATA" })).rejects.toMatchObject({
      code: "missing-credentials",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("토큰 발급 후 result envelope을 언랩한다", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(TOKEN_RESPONSE))
      .mockResolvedValueOnce(jsonResponse({ result: [{ symbol: "005930", lastPrice: "72000" }] }));

    const result = await tossGet<Array<{ symbol: string }>>("/api/v1/prices", {
      group: "MARKET_DATA",
      searchParams: { symbols: "005930" },
    });

    expect(result).toEqual([{ symbol: "005930", lastPrice: "72000" }]);

    // 첫 호출: 토큰 발급 (form-urlencoded)
    const [tokenUrl, tokenInit] = fetchMock.mock.calls[0];
    expect(String(tokenUrl)).toContain("/oauth2/token");
    expect(tokenInit?.method).toBe("POST");

    // 두 번째 호출: Bearer 헤더 + 쿼리 파라미터
    const [apiUrl, apiInit] = fetchMock.mock.calls[1];
    expect(String(apiUrl)).toContain("/api/v1/prices?symbols=005930");
    expect((apiInit?.headers as Record<string, string>).Authorization).toBe("Bearer test-token");
  });

  it("토큰을 캐시해 재사용한다", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(TOKEN_RESPONSE))
      .mockResolvedValueOnce(jsonResponse({ result: 1 }))
      .mockResolvedValueOnce(jsonResponse({ result: 2 }));

    await tossGet("/api/v1/prices", { group: "MARKET_DATA" });
    await tossGet("/api/v1/prices", { group: "MARKET_DATA" });

    const tokenCalls = fetchMock.mock.calls.filter(([url]) => String(url).includes("/oauth2/token"));
    expect(tokenCalls).toHaveLength(1);
  });

  it("에러 envelope을 TossApiError로 매핑한다", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(TOKEN_RESPONSE))
      .mockResolvedValueOnce(
        jsonResponse(
          { error: { requestId: "req-1", code: "stock-not-found", message: "종목 없음" } },
          { status: 404 },
        ),
      );

    const error = await tossGet("/api/v1/stocks", { group: "STOCK" }).then(
      () => null,
      (thrown: unknown) => thrown,
    );

    expect(error).toBeInstanceOf(TossApiError);
    expect(error).toMatchObject({
      code: "stock-not-found",
      status: 404,
      requestId: "req-1",
      message: "종목 없음",
    });
  });

  it("429는 Retry-After 후 1회 재시도한다", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(TOKEN_RESPONSE))
      .mockResolvedValueOnce(
        new Response("{}", { status: 429, headers: { "Retry-After": "0" } }),
      )
      .mockResolvedValueOnce(jsonResponse({ result: "ok" }));

    const result = await tossGet("/api/v1/prices", { group: "MARKET_DATA" });
    expect(result).toBe("ok");
  }, 10_000);
});
