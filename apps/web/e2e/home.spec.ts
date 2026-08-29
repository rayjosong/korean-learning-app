import { expect, test } from "@playwright/test";
import { openHomeFixture } from "./fixture";

test("empty Home offers a new-content entry point without fake metrics", async ({ page }) => {
  await openHomeFixture(page, "home-empty");
  await expect(page.getByRole("heading", { name: "Start something new" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Continue learning" })).toHaveCount(0);
  await expect(page.getByText(/ready for review/)).toHaveCount(0);
});

test("populated Home prioritizes Continue, due review, and recent content", async ({ page }) => {
  await openHomeFixture(page, "home-populated");
  await expect(page.getByRole("heading", { name: "Continue learning" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Continue/ })).toBeVisible();
  await expect(page.getByText("1 phrase ready for review")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Recent content" })).toBeVisible();
  await expect(page.getByRole("button", { name: /서울에서 보낸 하루/ })).toBeVisible();
  await expect(page.getByLabel("Korean YouTube URL")).toBeVisible();
});

test("Continue reuses the existing Watch workspace and restores the saved position", async ({ page }) => {
  await openHomeFixture(page, "home-populated");
  await page.getByRole("button", { name: /Continue/ }).click();
  await expect(page.getByRole("list", { name: "Timestamped transcript" })).toBeVisible();
  await expect(page.locator("body")).toHaveAttribute("data-player-state", "paused");
  await expect.poll(() => page.evaluate(() => window.__fixturePlayer?.getCurrentTime())).toBe(125);
});

test("Home Review action opens the existing review surfaces", async ({ page }) => {
  await openHomeFixture(page, "home-due-only");
  await page.getByRole("button", { name: "Review ->" }).click();
  await expect(page.getByRole("region", { name: "Contextual review" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Mixed review" })).toBeVisible();
});
