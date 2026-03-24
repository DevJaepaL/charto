import { expect, test } from "@playwright/test";

test("homepage and analysis page render in demo mode", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /국내 증시 종목을/i })).toBeVisible();
  await expect(page.getByLabel("종목 검색")).toBeVisible();

  await page.goto("/analyze/005930");

  await expect(page.getByRole("heading", { name: "삼성전자" })).toBeVisible();
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
