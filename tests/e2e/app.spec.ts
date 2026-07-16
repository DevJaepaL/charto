import { expect, test } from "@playwright/test";

test("홈 대시보드가 데모 모드에서 렌더링된다", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "오늘 시장의 큰 흐름" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "섹터 흐름" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "오늘의 랭킹" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "투자자 순매수" })).toBeVisible();

  // 히트맵 타일이 채워져 있다
  await expect(page.getByRole("link", { name: /반도체/ }).first()).toBeVisible();
});

test("히트맵 타일 클릭 시 섹터 상세로 이동한다", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("link", { name: /반도체/ }).first().click();

  await expect(page).toHaveURL(/\/sector\/KR\/semiconductor/);
  await expect(page.getByRole("heading", { name: /반도체 섹터/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "주요 구성 종목" })).toBeVisible();
  await expect(page.getByText("SK하이닉스")).toBeVisible();
});

test("시장·기간 전환이 동작한다", async ({ page }) => {
  await page.goto("/");

  const heatmap = page.getByLabel("섹터 히트맵");

  // 미국 탭 전환
  await heatmap.getByRole("tab", { name: "미국" }).click();
  await expect(heatmap.getByRole("link", { name: /유틸리티/ }).first()).toBeVisible();

  // 기간 전환
  await heatmap.getByRole("tab", { name: "1개월" }).click();
  await expect(heatmap.getByText(/1개월 수익률/)).toBeVisible();
});

test("미국 섹터 상세는 애널리스트 의견 링크를 제공한다", async ({ page }) => {
  await page.goto("/sector/US/technology");

  await expect(page.getByRole("heading", { name: /기술.*섹터/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /TipRanks/ }).first()).toBeVisible();
});
