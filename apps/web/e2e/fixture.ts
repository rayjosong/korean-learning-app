import { expect, type Page } from "@playwright/test";
import type { FixtureScenario } from "@/lib/fixture-session";

declare global {
  interface Window {
    __fixturePlayer?: { seekTo(seconds: number): void; getCurrentTime(): number };
  }
}

export async function openFixture(page: Page, scenario: FixtureScenario = "watch-study") {
  await page.addInitScript(() => {
    const RealDate = Date;
    class FixtureDate extends RealDate {
      constructor(value?: string | number | Date) {
        super(value ?? "2026-01-15T00:00:00.000Z");
      }
      static now() {
        return new RealDate("2026-01-15T00:00:00.000Z").valueOf();
      }
    }
    (globalThis as { Date: unknown }).Date = FixtureDate;

    class FixturePlayer {
      private currentTime = 0;
      constructor(element: HTMLElement, options: { events: { onReady: (event: { target: FixturePlayer }) => void } }) {
        element.dataset.player = "fixture";
        (window as Window & { __fixturePlayer?: FixturePlayer }).__fixturePlayer = this;
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
  await page.goto(`/?fixture=${scenario}`);
  await expect(page.getByRole("list", { name: "Timestamped transcript" })).toBeVisible();
  await page.evaluate(async () => {
    await document.fonts.ready;
    if (!document.fonts.check('18px "Pretendard Variable"')) {
      throw new Error("Pretendard Variable did not load in the fixture.");
    }
  });
}

export async function openHomeFixture(page: Page, scenario: "home-empty" | "home-populated" | "home-due-only" = "home-empty") {
  await page.addInitScript(() => {
    const RealDate = Date;
    class FixtureDate extends RealDate {
      constructor(value?: string | number | Date) {
        super(value ?? "2026-01-15T00:00:00.000Z");
      }
      static now() {
        return new RealDate("2026-01-15T00:00:00.000Z").valueOf();
      }
    }
    (globalThis as { Date: unknown }).Date = FixtureDate;

    class FixturePlayer {
      private currentTime = 0;
      constructor(element: HTMLElement, options: { events: { onReady: (event: { target: FixturePlayer }) => void } }) {
        element.dataset.player = "fixture";
        (window as Window & { __fixturePlayer?: FixturePlayer }).__fixturePlayer = this;
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
  await page.goto(`/?fixture=${scenario}`);
  await expect(page.getByRole("heading", { name: "안녕하세요." })).toBeVisible();
  await expect(page.getByLabel("Korean YouTube URL")).toBeVisible();
}


export async function openProgressFixture(page: Page, scenario: "progress-empty" | "progress-populated" = "progress-empty") {
  await page.addInitScript(() => {
    const RealDate = Date;
    class FixtureDate extends RealDate {
      constructor(value?: string | number | Date) {
        super(value ?? "2026-01-15T00:00:00.000Z");
      }
      static now() {
        return new RealDate("2026-01-15T00:00:00.000Z").valueOf();
      }
    }
    (globalThis as { Date: unknown }).Date = FixtureDate;
  });
  await page.goto(`/progress?fixture=${scenario}`);
  await expect(page.getByRole("heading", { name: "Your Korean" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Progress dashboard" })).toBeVisible();
}
