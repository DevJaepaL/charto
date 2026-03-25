import { expect, test } from "@playwright/test";

test("homepage and analysis page render in demo mode", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /국내 증시 종목을/i })).toBeVisible();
  await expect(page.getByLabel("종목 검색")).toBeVisible();
  await expect(page.getByText("분석 미리보기")).toBeVisible();
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
