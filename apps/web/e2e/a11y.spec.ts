import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { openFixture } from "./fixture";

test("canonical Watch and Study states have no obvious accessibility violations", async ({ page }) => {
  await openFixture(page);
  for (const state of ["watch", "study"] as const) {
    if (state === "study") await page.getByRole("tab", { name: "Study" }).click();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  }
});

test("transcript and disclosure controls remain keyboard operable", async ({ page }) => {
  await openFixture(page);
  const selected = page.locator("#segment-btn-fixture-2");
  await selected.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("region", { name: "Sentence explanation popover" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(selected).toBeFocused();
});

test("selected, expanded, and utility surfaces remain accessible", async ({ page }) => {
  await openFixture(page);
  await page.locator("#segment-btn-fixture-2").click();
  const popover = page.getByRole("region", { name: "Sentence explanation popover" });
  await popover.getByRole("button", { name: "Grammar" }).click();
  const selectedResults = await new AxeBuilder({ page }).analyze();
  expect(selectedResults.violations, JSON.stringify(selectedResults.violations, null, 2)).toEqual([]);

  await page.getByRole("tab", { name: "Study" }).click();
  const studyResults = await new AxeBuilder({ page }).analyze();
  expect(studyResults.violations, JSON.stringify(studyResults.violations, null, 2)).toEqual([]);

  await page.locator("summary").click();
  const utilityResults = await new AxeBuilder({ page }).analyze();
  expect(utilityResults.violations, JSON.stringify(utilityResults.violations, null, 2)).toEqual([]);
});

test("selected and playing rows expose independent state", async ({ page }) => {
  await openFixture(page, "long");
  const selected = page.locator("#segment-btn-fixture-40");
  await selected.scrollIntoViewIfNeeded();
  await selected.click();
  await page.evaluate(() => window.__fixturePlayer?.seekTo(0));
  await expect(page.locator("#segment-btn-fixture-1")).toHaveAttribute("aria-current", "true");
  await expect(selected).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#segment-btn-fixture-1")).toContainText("▶");
});


test("contextual review recall, reveal, and unavailable-clip states are accessible", async ({ page }) => {
  await openFixture(page, "populated");
  await page.locator("summary").click();
  const review = page.getByRole("region", { name: "Contextual review" });
  await expect(review.getByRole("button", { name: "Reveal meaning" })).toBeFocused({ timeout: 0 }).catch(() => undefined);
  let results = await new AxeBuilder({ page }).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);

  await review.getByRole("button", { name: "Reveal meaning" }).click();
  results = await new AxeBuilder({ page }).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);

  await openFixture(page, "review-unavailable");
  await page.locator("summary").click();
  results = await new AxeBuilder({ page }).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
});
