import assert from "node:assert/strict";
import test from "node:test";

import { isUsableReviewContext, reviewClipWindow } from "./review-context.ts";

const context = {
  id: "context",
  videoId: "video",
  transcriptSegmentId: "segment",
  sentence: "그래서 그냥 걸어가려고요.",
  startTimeMs: 4_000,
  endTimeMs: 7_500
};

test("review context rejects incomplete clip sources", () => {
  assert.equal(isUsableReviewContext(context), true);
  assert.equal(isUsableReviewContext({ ...context, endTimeMs: 4_000 }), false);
  assert.equal(isUsableReviewContext({ ...context, videoId: "" }), false);
});

test("review clip window pads short sources and caps long ones", () => {
  assert.deepEqual(reviewClipWindow(context), { startTimeMs: 2_750, endTimeMs: 8_750 });
  assert.deepEqual(reviewClipWindow({ ...context, endTimeMs: 40_000 }), { startTimeMs: 4_000, endTimeMs: 24_000 });
});
