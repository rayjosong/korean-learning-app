import assert from "node:assert/strict";
import test from "node:test";

import { compareContentProgress, createContentProgressSnapshot } from "../src/revisit.ts";

const estimate = (value) => ({
  band: value >= 70 ? "beginner-friendly" : value >= 40 ? "intermediate" : "challenging",
  likelyComprehension: { min: value - 10, max: value + 10 },
  source: "personalized",
  reasonCodes: ["known-coverage"]
});

test("first visit reports insufficient history", () => {
  const current = createContentProgressSnapshot({
    id: "video-1:visit-1", videoId: "video-1", capturedAt: "2026-08-26T00:00:00.000Z", estimate: estimate(50)
  });
  assert.equal(compareContentProgress(current).status, "insufficient-history");
});

test("comparison reports improvement, lower progress, unchanged progress, and elapsed time", () => {
  const previous = createContentProgressSnapshot({
    id: "video-1:visit-1", videoId: "video-1", capturedAt: "2026-08-19T00:00:00.000Z", estimate: estimate(50)
  });
  const improved = createContentProgressSnapshot({
    id: "video-1:visit-2", videoId: "video-1", capturedAt: "2026-08-26T00:00:00.000Z", estimate: estimate(80)
  });
  assert.equal(compareContentProgress(improved, previous).status, "improved");
  assert.equal(compareContentProgress(improved, previous).elapsedDays, 7);
  const lower = { ...improved, comprehensionMidpoint: 40 };
  assert.equal(compareContentProgress(lower, previous).status, "lower");
  const same = { ...improved, comprehensionMidpoint: previous.comprehensionMidpoint };
  assert.equal(compareContentProgress(same, previous).status, "unchanged");
});
