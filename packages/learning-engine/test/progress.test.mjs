import assert from "node:assert/strict";
import test from "node:test";

import { aggregateProgressSnapshot } from "../src/progress.ts";

const baseItem = (state) => ({
  id: state,
  kind: "word",
  text: state,
  state,
  recognitionConfidence: 50,
  productionConfidence: 50,
  encounters: 1,
  successes: 0,
  failures: 0,
  contextIds: []
});

test("aggregates learning counts, review success, recent explanations, and unique content", () => {
  const snapshot = aggregateProgressSnapshot({
    items: [baseItem("known"), baseItem("learning"), baseItem("unknown")],
    reviews: [
      { outcome: "success", reviewedAt: "2026-08-26T10:00:00.000Z" },
      { outcome: "failure", reviewedAt: "2026-08-26T11:00:00.000Z" }
    ],
    explanations: [
      { createdAt: "2026-08-25T10:00:00.000Z" },
      { createdAt: "2026-08-10T10:00:00.000Z" }
    ],
    studiedContent: [{ videoId: "a" }, { videoId: "a" }, { videoId: "b" }],
    now: "2026-08-26T12:00:00.000Z"
  });

  assert.equal(snapshot.knownItems, 1);
  assert.equal(snapshot.learningItems, 1);
  assert.deepEqual(snapshot.reviewSuccess, { successful: 1, total: 2, percentage: 50 });
  assert.deepEqual(snapshot.explanationFrequency, { count: 1, windowDays: 7 });
  assert.equal(snapshot.contentStudied, 2);
});

test("empty data uses honest empty metrics", () => {
  assert.deepEqual(aggregateProgressSnapshot({
    items: [], reviews: [], explanations: [], studiedContent: [],
    now: "2026-08-26T12:00:00.000Z"
  }), {
    knownItems: 0,
    learningItems: 0,
    reviewSuccess: { successful: 0, total: 0, percentage: null },
    explanationFrequency: { count: 0, windowDays: 7 },
    contentStudied: 0
  });
});
