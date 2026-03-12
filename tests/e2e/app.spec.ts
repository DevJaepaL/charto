import { expect, test } from "@playwright/test";

test("homepage and analysis page render in demo mode", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /보고 싶은 종목을/i })).toBeVisible();
  await expect(page.getByLabel("종목 검색")).toBeVisible();

  await page.goto("/analyze/005930");

  await expect(page.getByRole("heading", { name: "삼성전자" })).toBeVisible();
  await expect(page.getByText("한눈에 보기")).toBeVisible();
  await expect(page.getByRole("heading", { name: "AI 브리핑" })).toBeVisible();
});
