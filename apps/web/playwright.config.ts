import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  snapshotPathTemplate: "../../qa/29d/{arg}{ext}",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  expect: { toHaveScreenshot: { maxDiffPixelRatio: process.env.CI ? 0.03 : 0 } },
  reporter: [["html", { outputFolder: "playwright-report", open: "never" }], ["list"]],
  use: { baseURL: "http://127.0.0.1:3000", trace: "retain-on-failure", video: "retain-on-failure", screenshot: "only-on-failure", locale: "en-SG", ...devices["Desktop Chrome"] },
  webServer: { command: "pnpm exec next dev --hostname 127.0.0.1 --port 3000", url: "http://127.0.0.1:3000", reuseExistingServer: !process.env.CI, timeout: 120_000 }
});
