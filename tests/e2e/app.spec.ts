import { expect, test } from "@playwright/test";

test("homepage and analysis page render in demo mode", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /국내 증시 종목을/i })).toBeVisible();
  await expect(page.getByLabel("종목 검색")).toBeVisible();
  await expect(page.getByText("오늘 가장 많이 본 흐름")).toHaveCount(0);

  await page.goto("/analyze/005930");

  await expect(page.getByRole("heading", { name: "삼성전자" })).toBeVisible({ timeout: 15000 });
  await expect(page.getByText("종목 정보")).toBeVisible();
  await expect(page.getByRole("heading", { name: "AI 브리핑" })).toBeVisible();
});

test("clicking a stock from home shows the loading stage before analysis", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("종목 검색").click();
  await page.getByLabel("종목 검색").fill("005930");
  await expect(page.getByText("검색 결과")).toBeVisible();
  await page.getByRole("button", { name: /삼성전자/i }).first().click();

  await expect(page.getByRole("heading", { name: /종목과 차트를 분석하고 있어요/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: "삼성전자" })).toBeVisible({ timeout: 15000 });
});

test("loading ring keeps rotating while the analysis page is loading", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/analyze/005930*", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    await route.continue();
  });

  await page.goto("/");

  await page.getByLabel("종목 검색").click();
  await page.getByLabel("종목 검색").fill("005930");
  await expect(page.getByText("검색 결과")).toBeVisible();
  await page.getByRole("button", { name: /삼성전자/i }).first().click();

  await expect(page.getByRole("heading", { name: /종목과 차트를 분석하고 있어요/i })).toBeVisible();

  const ring = page.locator(".loading-ring--outer").first();
  await expect(ring).toBeVisible();

  const motion = await ring.evaluate(async (element) => {
    const animation = element.getAnimations()[0];

    if (!animation) {
      return {
        hasAnimation: false,
        advanced: false,
      };
    }

    const first = animation.currentTime ?? 0;
    await new Promise((resolve) => setTimeout(resolve, 500));
    const second = animation.currentTime ?? 0;

    return {
      hasAnimation: true,
      advanced: second > first,
      playState: animation.playState,
    };
  });

  expect(motion.hasAnimation).toBeTruthy();
  expect(motion.playState).toBe("running");
  expect(motion.advanced).toBeTruthy();
  await expect(page.getByRole("heading", { name: "삼성전자" })).toBeVisible({ timeout: 15000 });
});

test("mobile home search opens as a fullscreen overlay", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await page.getByLabel("종목 검색").click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  const overlayInput = dialog.locator('input[aria-label="종목 검색"]');
  await overlayInput.fill("005930");
  await expect(dialog.getByText("검색 결과")).toBeVisible();

  const metrics = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]');
    const panel = dialog?.querySelector(".scrollbar-visible");

    if (!dialog || !panel) {
      return null;
    }

    const dialogRect = dialog.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();

    return {
      viewportHeight: window.innerHeight,
      dialogTop: dialogRect.top,
      dialogBottom: dialogRect.bottom,
      panelBottom: panelRect.bottom,
    };
  });

  expect(metrics).not.toBeNull();
  expect(metrics?.dialogTop).toBeGreaterThanOrEqual(0);
  expect(metrics?.dialogBottom).toBeLessThanOrEqual(metrics?.viewportHeight ?? 0);
  expect(metrics?.panelBottom).toBeLessThanOrEqual(metrics?.viewportHeight ?? 0);
});

test("home shows investor flow candidates when the API returns them", async ({ page }) => {
  await page.route("**/api/market/accumulation?limit=6", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        label: "외인·기관 매수세가 이어지는 종목",
        source: "kis",
        windowDays: 5,
        asOf: "2026-04-02T09:00:00.000Z",
        notice: "test",
        items: [
          {
            stock: {
              symbol: "005930",
              isin: "KR7005930003",
              name: "삼성전자",
              market: "KOSPI",
            },
            foreignNetBuyAmount5d: 4200000000,
            institutionNetBuyAmount5d: 1800000000,
            combinedNetBuyAmount5d: 6000000000,
            positiveDays: 4,
            foreignPositiveDays: 5,
            institutionPositiveDays: 2,
            foreignBuyStreak: 5,
            institutionBuyStreak: 2,
            priceChangePercent5d: 2.31,
            signalKind: "both",
            reason: "외인 5일 연속 순매수 · 기관 2일 연속 순매수",
            rankScore: 123,
          },
        ],
      }),
    });
  });

  await page.goto("/");

  await expect(page.getByText("외인·기관 매수세가 이어지는 종목")).toBeVisible();
  await expect(page.getByRole("link", { name: /삼성전자/i })).toBeVisible();
  await expect(page.getByText("외인 5일 연속 순매수 · 기관 2일 연속 순매수")).toBeVisible();
});
