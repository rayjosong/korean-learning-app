import { expect, test } from "@playwright/test";
import { openFixture } from "./fixture";

test("canonical desktop states emit deterministic visual artifacts", async ({ page }) => {
  await openFixture(page);
  for (const state of ["watch-default", "watch-selected", "study-selected"] as const) {
    await page.goto("/?fixture=watch-study");
    await expect(page.getByRole("list", { name: "Timestamped transcript" })).toBeVisible();
    if (state === "watch-selected") await page.locator("#segment-btn-fixture-2").click();
    if (state === "study-selected") await page.getByRole("tab", { name: "Study" }).click();
    await expect(page).toHaveScreenshot(`${state}.png`, { fullPage: true, animations: "disabled" });
  }
});
