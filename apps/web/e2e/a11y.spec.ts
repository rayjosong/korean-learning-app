import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { openFixture, openHomeFixture, openProgressFixture } from "./fixture";

test("canonical Watch and Study states have no obvious accessibility violations", async ({ page }) => {
  await openFixture(page);
  for (const state of ["watch", "study"] as const) {
    if (state === "study") await page.getByRole("tab", { name: "Study" }).click();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  }
});

test("Home states have understandable landmarks and keyboard actions", async ({ page }) => {
  await openHomeFixture(page, "home-populated");
  let results = await new AxeBuilder({ page }).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  const input = page.getByLabel("Korean YouTube URL");
  await input.focus();
  await expect(input).toBeFocused();
  await page.getByRole("button", { name: "Review ->" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("region", { name: "Contextual review" })).toBeVisible();

  await openHomeFixture(page, "home-empty");
  results = await new AxeBuilder({ page }).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
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

  await page.getByText("Workspace Utilities & Settings").click();
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
  await page.getByText("Workspace Utilities & Settings").click();
  const review = page.getByRole("region", { name: "Contextual review" });
  let results = await new AxeBuilder({ page }).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);

  await review.getByRole("button", { name: "Reveal meaning" }).click();
  results = await new AxeBuilder({ page }).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);

  await openFixture(page, "review-unavailable");
  await page.getByText("Workspace Utilities & Settings").click();
  results = await new AxeBuilder({ page }).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
});


test("learner profile populated and empty states remain accessible", async ({ page }) => {
  await openFixture(page, "populated");
  await page.getByText("Workspace Utilities & Settings").click();
  let results = await new AxeBuilder({ page }).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);

  await openFixture(page);
  await page.getByText("Workspace Utilities & Settings").click();
  results = await new AxeBuilder({ page }).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
});


test("Progress populated and empty states have no obvious accessibility violations", async ({ page }) => {
  await openProgressFixture(page, "progress-populated");
  let results = await new AxeBuilder({ page }).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  await expect(page.getByRole("link", { name: "Progress" })).toHaveAttribute("aria-current", "page");

  await openProgressFixture(page, "progress-empty");
  results = await new AxeBuilder({ page }).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
});
