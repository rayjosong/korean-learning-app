import { expect, test } from "@playwright/test";
import { openFixture } from "./fixture";

test("contextual review keeps Korean first, replays the source, and records Got it", async ({ page }) => {
  await openFixture(page, "populated");
  await page.locator("summary").click();
  const review = page.getByRole("region", { name: "Contextual review" });
  await expect(review.getByText("그래서 그냥 걸어가려고요.")).toBeVisible();
  await expect(review.getByText("So I’m just going to walk there.")).toHaveCount(0);
  await review.getByRole("button", { name: "Play source clip" }).click();
  await expect(page.locator("body")).toHaveAttribute("data-player-state", "playing");
  await review.getByRole("button", { name: "Reveal meaning" }).click();
  await expect(review.getByText("So I’m just going to walk there.")).toBeVisible();
  await review.getByRole("button", { name: "Got it" }).click();
  await expect(review).toContainText("Nothing is due right now.");
});

test("unavailable source playback never blocks contextual review actions", async ({ page }) => {
  await openFixture(page, "review-unavailable");
  await page.locator("summary").click();
  const review = page.getByRole("region", { name: "Contextual review" });
  await expect(review).toContainText("The source clip is unavailable.");
  await review.getByRole("button", { name: "Reveal meaning" }).click();
  await review.getByRole("button", { name: "Again" }).click();
  await expect(review).toContainText("Nothing is due right now.");
});
