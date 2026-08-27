import { expect, test } from "@playwright/test";
import { openFixture } from "./fixture";

test("Watch to Study golden path preserves session and learner state", async ({ page }) => {
  await openFixture(page);
  const selected = page.locator("#segment-btn-fixture-2");
  await selected.click();
  await expect(page.getByRole("region", { name: "Sentence explanation popover" })).toBeVisible();
  await expect(page.getByText("So I’m just going to walk there.")).toBeVisible();
  await page.getByRole("button", { name: "그래서", exact: true }).click();
  await page.getByRole("button", { name: "Learn this", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Added to review");
  await page.getByRole("tab", { name: "Study" }).click();
  await expect(page.getByRole("tab", { name: "Study" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("region", { name: "Sentence explanation" })).toContainText("그래서 그냥 걸어가려고요.");
  await expect(page.locator("[data-player=fixture]")).toHaveCount(1);
  await page.getByRole("tab", { name: "Watch" }).click();
  await expect(page.getByRole("region", { name: "Sentence explanation popover" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Close explanation popover" })).toHaveCount(0);
  await expect(selected).toBeFocused();
});
