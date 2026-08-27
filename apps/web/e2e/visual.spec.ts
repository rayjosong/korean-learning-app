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

test("Study selected-sentence state matches the reviewed desktop baseline", async ({ page }) => {
  await openFixture(page);
  await page.getByRole("tab", { name: "Study" }).click();
  await expect(page).toHaveScreenshot("study-selected.png", { fullPage: true, animations: "disabled" });
});
