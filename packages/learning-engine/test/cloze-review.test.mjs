import assert from "node:assert/strict";
import test from "node:test";

import { applyReviewOutcome } from "../src/index.ts";

const item = {
  id: "item-1",
  kind: "word",
  text: "먹어요",
  state: "learning",
  recognitionConfidence: 40,
  productionConfidence: 15,
  encounters: 2,
  successes: 1,
  failures: 1,
  contextIds: ["context-1"],
  nextReviewAt: "2026-08-26T09:00:00.000Z"
};

test("a successful cloze-style recall increases recognition confidence and records the next review", () => {
  const result = applyReviewOutcome({
    item,
    outcome: "success",
    now: "2026-08-26T10:00:00.000Z",
    schedule: { intervalDays: 2, nextReviewAt: "2026-08-28T10:00:00.000Z" }
  });

  assert.equal(result.recognitionConfidence, 50);
  assert.equal(result.successes, 2);
  assert.equal(result.failures, 1);
  assert.equal(result.nextReviewAt, "2026-08-28T10:00:00.000Z");
});

test("a failed cloze-style recall lowers confidence without going below zero", () => {
  const result = applyReviewOutcome({
    item: { ...item, recognitionConfidence: 5 },
    outcome: "failure",
    now: "2026-08-26T10:00:00.000Z",
    schedule: { intervalDays: 1, nextReviewAt: "2026-08-27T10:00:00.000Z" }
  });

  assert.equal(result.recognitionConfidence, 0);
  assert.equal(result.successes, 1);
  assert.equal(result.failures, 2);
});
