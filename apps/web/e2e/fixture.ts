import { expect, type Page } from "@playwright/test";

export async function openFixture(page: Page) {
  await page.addInitScript(() => {
    class FixturePlayer {
      private currentTime = 0;
      constructor(element: HTMLElement, options: { events: { onReady: (event: { target: FixturePlayer }) => void } }) {
        element.dataset.player = "fixture";
        queueMicrotask(() => options.events.onReady({ target: this }));
      }
      getCurrentTime() { return this.currentTime; }
      seekTo(seconds: number) { this.currentTime = seconds; }
      playVideo() { document.body.dataset.playerState = "playing"; }
      pauseVideo() { document.body.dataset.playerState = "paused"; }
      destroy() {}
    }
    (window as Window & { YT?: unknown }).YT = { Player: FixturePlayer };
  });
  await page.goto("/?fixture=watch-study");
  await expect(page.getByRole("list", { name: "Timestamped transcript" })).toBeVisible();
}
