import assert from "node:assert/strict";
import test from "node:test";

import {
  DeterministicReviewScheduler
} from "../src/index.ts";

const scheduler = new DeterministicReviewScheduler();
const now = "2026-08-26T10:00:00.000Z";

test("successful review increases the interval and moves the due date forward", () => {
  const result = scheduler.schedule({
    now,
    previousIntervalDays: 3,
    outcome: "success"
  });

  assert.equal(result.intervalDays, 6);
  assert.equal(result.nextReviewAt, "2026-09-01T10:00:00.000Z");
});

test("a first successful review starts with a longer-than-daily interval", () => {
  const result = scheduler.schedule({ now, outcome: "success" });

  assert.equal(result.intervalDays, 2);
  assert.equal(result.nextReviewAt, "2026-08-28T10:00:00.000Z");
});

test("failed review shortens the interval", () => {
  const result = scheduler.schedule({
    now,
    previousIntervalDays: 8,
    outcome: "failure"
  });

  assert.equal(result.intervalDays, 4);
  assert.equal(result.nextReviewAt, "2026-08-30T10:00:00.000Z");
});

test("failed daily review never schedules in the past or below one day", () => {
  const result = scheduler.schedule({
    now,
    previousIntervalDays: 1,
    outcome: "failure"
  });

  assert.equal(result.intervalDays, 1);
  assert.equal(result.nextReviewAt, "2026-08-27T10:00:00.000Z");
});
