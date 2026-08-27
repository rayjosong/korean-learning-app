import { expect, test } from "@playwright/test";
import { openFixture } from "./fixture";

test("canonical desktop states emit deterministic visual artifacts", async ({ page }, testInfo) => {
  await openFixture(page);
  for (const state of ["watch-default", "watch-selected", "study-selected"] as const) {
    if (state === "watch-selected") await page.locator("#segment-btn-fixture-2").click();
    if (state === "study-selected") await page.getByRole("tab", { name: "Study" }).click();
    const screenshot = await page.screenshot({ fullPage: true, animations: "disabled" });
    expect(screenshot.byteLength).toBeGreaterThan(1_000);
    await testInfo.attach(state, { body: screenshot, contentType: "image/png" });
  }
});
