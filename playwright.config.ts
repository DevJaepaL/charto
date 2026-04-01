import { defineConfig, devices } from "@playwright/test";

const playwrightPort = process.env.PLAYWRIGHT_PORT?.trim() || "3000";
const playwrightBaseUrl = process.env.PLAYWRIGHT_BASE_URL?.trim() || `http://127.0.0.1:${playwrightPort}`;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  use: {
    baseURL: playwrightBaseUrl,
    trace: "retain-on-failure",
  },
  webServer: {
    command: `pnpm exec next dev --port ${playwrightPort}`,
    url: playwrightBaseUrl,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],
});
