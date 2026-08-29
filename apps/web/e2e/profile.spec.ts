import { expect, test } from "@playwright/test";
import { openFixture } from "./fixture";

test("populated learner profile reports local evidence without conflating channels", async ({ page }) => {
  await openFixture(page, "populated");
  await page.locator("summary").click();

  const profile = page.getByRole("region", { name: "Learner profile" });
  await expect(profile).toBeVisible();

  const knownMetric = profile.getByText("Known", { exact: true }).locator("..");
  const learningMetric = profile.getByText("Learning", { exact: true }).locator("..");
  await expect(knownMetric.getByText("1", { exact: true })).toBeVisible();
  await expect(learningMetric.getByText("1", { exact: true })).toBeVisible();
  await expect(profile).toContainText("80% average");
  await expect(profile).toContainText("60% average");
  await expect(profile).toContainText("-려고요");
  await expect(profile).toContainText("해요체");
  await expect(profile).toContainText("Familiarity here means exposure, not mastery.");
});

test("empty learner profile avoids fake confidence metrics", async ({ page }) => {
  await openFixture(page);
  await page.locator("summary").click();

  const profile = page.getByRole("region", { name: "Learner profile" });
  await expect(profile).toContainText("Your profile will appear as you save words");
  await expect(profile).not.toContainText(/% average/);
  await expect(profile).not.toContainText("No reviews yet");
});

test("learner profile refreshes after saving a new item", async ({ page }) => {
  await openFixture(page, "populated");
  await page.locator("#segment-btn-fixture-2").click();

  const popover = page.getByRole("region", { name: "Sentence explanation popover" });
  await popover.getByRole("button", { name: "걸어가려고요", exact: true }).click();
  await popover.getByRole("button", { name: "Learn this", exact: true }).click();
  await expect(popover.getByRole("status")).toContainText("Added to review");

  await page.locator("summary").click();
  const profile = page.getByRole("region", { name: "Learner profile" });
  const learningMetric = profile.getByText("Learning", { exact: true }).locator("..");
  await expect(learningMetric.getByText("2", { exact: true })).toBeVisible();
});
