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

test("aggregates current learning state, recent recall, activity, and unique content", () => {
  const snapshot = aggregateProgressSnapshot({
    items: [baseItem("known"), baseItem("learning"), baseItem("unknown")],
    reviews: [
      { outcome: "success", reviewedAt: "2026-08-26T10:00:00.000Z" },
      { outcome: "failure", reviewedAt: "2026-08-26T11:00:00.000Z" },
      { outcome: "success", reviewedAt: "2026-07-01T00:00:00.000Z" }
    ],
    explanations: [
      { createdAt: "2026-08-25T10:00:00.000Z" },
      { createdAt: "2026-08-10T10:00:00.000Z" }
    ],
    studiedContent: [{ videoId: "a" }, { videoId: " a " }, { videoId: "b" }, { videoId: " " }],
    contentProgressSnapshots: [],
    now: "2026-08-26T12:00:00.000Z"
  });

  assert.equal(snapshot.knownItems, 1);
  assert.equal(snapshot.learningItems, 1);
  assert.deepEqual(snapshot.reviewSuccess, { successful: 1, total: 2, percentage: 50, windowDays: 30 });
  assert.deepEqual(snapshot.explanationFrequency, { count: 1, windowDays: 7 });
  assert.equal(snapshot.contentStudied, 2);
  assert.deepEqual(snapshot.revisits, []);
});

test("includes exact rolling-window boundaries and excludes future or invalid records", () => {
  const snapshot = aggregateProgressSnapshot({
    items: [],
    reviews: [
      { outcome: "success", reviewedAt: "2026-07-27T00:00:00.000Z" },
      { outcome: "failure", reviewedAt: "2026-08-26T00:00:00.000Z" },
      { outcome: "success", reviewedAt: "2026-08-26T00:00:00.001Z" },
      { outcome: "success", reviewedAt: "not-a-date" }
    ],
    explanations: [
      { createdAt: "2026-08-19T00:00:00.000Z" },
      { createdAt: "2026-08-26T00:00:00.001Z" }
    ],
    studiedContent: [],
    contentProgressSnapshots: [],
    now: "2026-08-26T00:00:00.000Z"
  });

  assert.deepEqual(snapshot.reviewSuccess, { successful: 1, total: 2, percentage: 50, windowDays: 30 });
  assert.deepEqual(snapshot.explanationFrequency, { count: 1, windowDays: 7 });
});

test("empty data uses honest empty metrics", () => {
  assert.deepEqual(aggregateProgressSnapshot({
    items: [], reviews: [], explanations: [], studiedContent: [], contentProgressSnapshots: [],
    now: "2026-08-26T12:00:00.000Z"
  }), {
    knownItems: 0,
    learningItems: 0,
    reviewSuccess: { successful: 0, total: 0, percentage: null, windowDays: 30 },
    explanationFrequency: { count: 0, windowDays: 7 },
    contentStudied: 0,
    revisits: []
  });
});
