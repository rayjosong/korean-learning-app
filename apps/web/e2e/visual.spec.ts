import { expect, test } from "@playwright/test";
import { openFixture } from "./fixture";

// Each state gets a fresh page so baselines cannot inherit prior interactions.
test("Watch default state matches the reviewed desktop baseline", async ({ page }) => {
  await openFixture(page);
  await expect(page.locator('[data-player="fixture"]')).toBeVisible();
  await expect(page).toHaveScreenshot("watch-default.png", { fullPage: true, animations: "disabled" });
});

test("Watch selected-sentence state matches the reviewed desktop baseline", async ({ page }) => {
  await openFixture(page);
  await expect(page.locator("#segment-btn-fixture-2")).toBeVisible();
  await page.locator("#segment-btn-fixture-2").click();
  await expect(page).toHaveScreenshot("watch-selected.png", { fullPage: true, animations: "disabled" });
});

// Establish selection first: Study must retain the active inspection context from Watch.
test("Study selected-sentence state matches the reviewed desktop baseline", async ({ page }) => {
  await openFixture(page);
  await expect(page.locator("#segment-btn-fixture-2")).toBeVisible();
  await page.locator("#segment-btn-fixture-2").click();
  await page.getByRole("tab", { name: "Study" }).click();
  await expect(page).toHaveScreenshot("study-selected.png", { fullPage: true, animations: "disabled" });
});

test("Home entry state matches the Warm Korean Editorial layout", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.getByLabel("Korean YouTube URL")).toBeVisible();
  await expect(page).toHaveScreenshot("32-home-1440.png", { fullPage: true, animations: "disabled" });
});

test("Watch default state is covered at the canonical 1440px viewport", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openFixture(page);
  await expect(page.locator('[data-player="fixture"]')).toBeVisible();
  await expect(page).toHaveScreenshot("32-watch-default-1440.png", { fullPage: true, animations: "disabled" });
});

test("Watch selected state keeps the explanation contextual", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openFixture(page);
  await page.locator("#segment-btn-fixture-2").click();
  await expect(page.getByRole("region", { name: "Sentence explanation popover" })).toContainText("So I’m just going to walk there.");
  await expect(page).toHaveScreenshot("32-watch-selected-1440.png", { fullPage: true, animations: "disabled" });
});

test("Watch expanded explanation remains readable", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openFixture(page);
  await page.locator("#segment-btn-fixture-2").click();
  const popover = page.getByRole("region", { name: "Sentence explanation popover" });
  await popover.getByRole("button", { name: "Grammar" }).click();
  await popover.getByRole("button", { name: "Nuance" }).click();
  await expect(popover.getByText("A gentle way to state an intention.")).toBeVisible();
  await expect(page).toHaveScreenshot("32-watch-expanded-1440.png", { fullPage: true, animations: "disabled" });
});

test("Study nearby navigation updates the focused context", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openFixture(page);
  await page.locator("#segment-btn-fixture-2").click();
  await page.getByRole("tab", { name: "Study" }).click();
  await page.locator('[aria-label="Nearby transcript"] button').filter({ hasText: "생각보다 길이 조금 멀어요." }).click();
  await expect(page.getByRole("region", { name: "Sentence explanation" })).toContainText("생각보다 길이 조금 멀어요.");
  await expect(page).toHaveScreenshot("32-study-nearby-1440.png", { fullPage: true, animations: "disabled" });
});

test("Long transcript keeps selection and playback states distinct", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openFixture(page, "long");
  const selected = page.locator("#segment-btn-fixture-40");
  await selected.scrollIntoViewIfNeeded();
  await selected.click();
  await page.evaluate(() => window.__fixturePlayer?.seekTo(152));
  await expect(page.locator("#segment-btn-fixture-39")).toHaveAttribute("aria-current", "true");
  await expect(selected).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("region", { name: "Sentence explanation popover" })).toContainText("This is a natural Korean sentence.");
  await expect(page).toHaveScreenshot("32-long-transcript-1440.png", { fullPage: true, animations: "disabled" });
});

test("Compact Watch and Study states remain usable", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await openFixture(page);
  await page.locator("#segment-btn-fixture-2").click();
  await expect(page).toHaveScreenshot("32-watch-compact-1024.png", { fullPage: true, animations: "disabled" });
  await page.getByRole("tab", { name: "Study" }).click();
  await expect(page).toHaveScreenshot("32-study-compact-1024.png", { fullPage: true, animations: "disabled" });
});

test("Review utility renders truthful populated and empty states", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openFixture(page, "populated");
  await page.locator("summary").click();
  const review = page.getByRole("region", { name: "Mixed review" });
  await expect(review).toContainText("____ 그냥 걸어가려고요.");
  await expect(review).toHaveScreenshot("32-review-populated-1440.png", { animations: "disabled" });
});

test("Review utility has an honest empty state", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openFixture(page);
  await page.locator("summary").click();
  const review = page.getByRole("region", { name: "Mixed review" });
  await expect(review).toContainText("Nothing is due right now.");
  await expect(review).toHaveScreenshot("32-review-empty-1440.png", { animations: "disabled" });
});

test("Progress utility renders populated and empty states", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openFixture(page, "populated");
  await page.locator("summary").click();
  const progress = page.getByRole("region", { name: "Progress dashboard" });
  await expect(progress).toContainText("Known items");
  await expect(progress).toHaveScreenshot("32-progress-populated-1440.png", { animations: "disabled" });
});

test("Progress utility preserves honest empty metrics", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openFixture(page);
  await page.locator("summary").click();
  const progress = page.getByRole("region", { name: "Progress dashboard" });
  await expect(progress).toContainText("No reviews yet");
  await expect(progress).toHaveScreenshot("32-progress-empty-1440.png", { animations: "disabled" });
});

test("Settings utility renders ready and saved states", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openFixture(page, "populated");
  await page.locator("summary").click();
  const settings = page.getByRole("region", { name: "AI provider settings" });
  await expect(settings.getByRole("button", { name: "Save changes" })).toBeVisible();
  await expect(settings).toHaveScreenshot("32-settings-saved-1440.png", { animations: "disabled" });
});

test("Settings utility keeps missing state actionable", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openFixture(page);
  await page.locator("summary").click();
  const settings = page.getByRole("region", { name: "AI provider settings" });
  await expect(settings.getByRole("button", { name: "Save settings" })).toBeDisabled();
  await expect(settings).toHaveScreenshot("32-settings-empty-1440.png", { animations: "disabled" });
});

test("Utilities and guidance share the same surface system", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openFixture(page, "populated");
  await page.locator("summary").click();
  await expect(page.getByRole("region", { name: "Learner profile" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Learning history" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Video difficulty estimate" })).toBeVisible();
  await expect(page).toHaveScreenshot("32-utilities-guidance-1440.png", { fullPage: true, animations: "disabled" });
});

test("Loading and error states have stable recovery surfaces", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openFixture(page, "loading");
  await page.locator("#segment-btn-fixture-2").click();
  const popover = page.getByRole("region", { name: "Sentence explanation popover" });
  await expect(popover).toContainText("Explaining the sentence");
  await expect(page).toHaveScreenshot("32-loading-1440.png", { fullPage: true, animations: "disabled" });
  await page.evaluate(() => window.dispatchEvent(new Event("fixture:release-explanation")));

  await openFixture(page, "error");
  await page.locator("#segment-btn-fixture-2").click();
  await expect(page.locator('[role="alert"]').filter({ hasText: "Fixture explanation failed" })).toBeVisible();
  await expect(page).toHaveScreenshot("32-error-1440.png", { fullPage: true, animations: "disabled" });
});

test("Learning feedback remains visible with Undo", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openFixture(page);
  await page.locator("#segment-btn-fixture-2").click();
  const popover = page.getByRole("region", { name: "Sentence explanation popover" });
  await popover.getByRole("button", { name: "그래서", exact: true }).click();
  await popover.getByRole("button", { name: "Learn this", exact: true }).click();
  await expect(popover.getByRole("status")).toContainText("Added to review");
  await expect(page).toHaveScreenshot("32-learning-feedback-1440.png", { fullPage: true, animations: "disabled" });
});
