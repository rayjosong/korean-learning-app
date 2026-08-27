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
