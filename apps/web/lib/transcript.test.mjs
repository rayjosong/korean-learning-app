import assert from "node:assert/strict";
import test from "node:test";
import { findSegmentAtTime, formatTimestamp } from "./transcript.ts";

const segments = [
  { id: "one", text: "첫 번째", startTimeMs: 0, endTimeMs: 1000 },
  { id: "two", text: "두 번째", startTimeMs: 1200, endTimeMs: 2500 }
];

test("finds the segment at a playback position", () => {
  assert.equal(findSegmentAtTime(segments, 0)?.id, "one");
  assert.equal(findSegmentAtTime(segments, 1000), undefined);
  assert.equal(findSegmentAtTime(segments, 1200)?.id, "two");
  assert.equal(findSegmentAtTime(segments, 2500), undefined);
});

test("formats transcript timestamps", () => {
  assert.equal(formatTimestamp(0), "0:00");
  assert.equal(formatTimestamp(65000), "1:05");
});
