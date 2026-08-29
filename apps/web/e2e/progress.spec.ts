import { expect, test } from "@playwright/test";

import { openHomeFixture, openProgressFixture } from "./fixture";

test("Progress is reachable from Home and supports direct route reload", async ({ page }) => {
  await openHomeFixture(page, "home-populated");
  await page.getByRole("link", { name: "Progress" }).click();
  await expect(page).toHaveURL(/\/progress$/);
  await expect(page.getByRole("link", { name: "Progress" })).toHaveAttribute("aria-current", "page");
  await page.reload();
  await expect(page.getByRole("heading", { name: "Your Korean" })).toBeVisible();
});

test("Progress prioritizes recent review recall over supporting activity", async ({ page }) => {
  await openProgressFixture(page, "progress-populated");
  await expect(page.getByRole("heading", { name: "Review recall" })).toBeVisible();
  await expect(page.getByText("1 of 3 recalled (33%)")).toBeVisible();
  await expect(page.getByText("Successful reviews out of all completed reviews in the last 30 days. This is recall evidence, not a measure of total Korean comprehension.")).toBeVisible();
  await expect(page.getByText("Known phrases and words")).toBeVisible();
  await expect(page.getByText("Distinct content studied")).toBeVisible();
});

test("Progress has one actionable empty state", async ({ page }) => {
  await openProgressFixture(page, "progress-empty");
  await expect(page.getByRole("heading", { name: "Your learning evidence will build here." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Start learning" })).toHaveAttribute("href", "/");
  await expect(page.getByText("Known phrases and words")).toHaveCount(0);
});
