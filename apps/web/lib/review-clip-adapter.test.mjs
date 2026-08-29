import assert from "node:assert/strict";
import test from "node:test";

import { createSessionReviewClipAdapter } from "./review-clip-adapter.ts";

test("session clip adapter seeks and pauses on load, then plays the bounded clip", () => {
  const calls = [];
  const adapter = createSessionReviewClipAdapter({
    activeVideoId: "video-a",
    seekTo: (seconds) => calls.push(["seek", seconds]),
    play: () => calls.push(["play"]),
    pause: () => calls.push(["pause"])
  });
  assert.equal(adapter.loadClip({ videoId: "other-video", window: { startTimeMs: 1_000, endTimeMs: 2_000 } }), "unavailable");
  assert.deepEqual(calls, []);

  assert.equal(adapter.loadClip({ videoId: "video-a", window: { startTimeMs: 2_000, endTimeMs: 6_000 } }), "available");
  assert.deepEqual(calls, [["seek", 2], ["pause"]]);
  adapter.play();
  assert.deepEqual(calls.slice(2), [["seek", 2], ["play"]]);
  adapter.pause();
});
