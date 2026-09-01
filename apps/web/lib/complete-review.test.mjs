import "fake-indexeddb/auto";
import assert from "node:assert/strict";
import test from "node:test";

import { completeReview, completeClozeReview } from "./complete-cloze-review.ts";
import { ExplanationDatabase, putLearningItem } from "@korean-learning/storage";

test("completing a production review updates only production confidence and records its mode", async () => {
  const database = new ExplanationDatabase("complete-production-review-test");
  const item = {
    id: "item-1", kind: "word", text: "먹어요", state: "learning",
    recognitionConfidence: 40, productionConfidence: 15, encounters: 2,
    successes: 1, failures: 0, contextIds: [],
    lastSeenAt: "2026-08-25T10:00:00.000Z", nextReviewAt: "2026-08-26T09:00:00.000Z"
  };
  await putLearningItem(database, item);

  await completeReview({
    database,
    review: { item },
    mode: "production",
    outcome: "success",
    now: "2026-08-26T10:00:00.000Z"
  });

  const saved = await database.learningItems.get(item.id);
  assert.equal(saved?.recognitionConfidence, 40);
  assert.equal(saved?.productionConfidence, 25);
  assert.equal((await database.reviewRecords.toArray())[0]?.mode, "production");
  await database.delete();
});

test("completing a cloze review records its mode as cloze", async () => {
  const database = new ExplanationDatabase("complete-cloze-review-test");
  const item = {
    id: "item-2", kind: "word", text: "먹어요", state: "learning",
    recognitionConfidence: 40, productionConfidence: 15, encounters: 2,
    successes: 1, failures: 0, contextIds: [],
    lastSeenAt: "2026-08-25T10:00:00.000Z", nextReviewAt: "2026-08-26T09:00:00.000Z"
  };
  await putLearningItem(database, item);

  await completeClozeReview({
    database,
    review: { item },
    outcome: "success",
    now: "2026-08-26T10:00:00.000Z"
  });

  const saved = await database.learningItems.get(item.id);
  // Cloze tests apply to recognition confidence since they use mode="cloze" internally
  // and applyReviewOutcome updates recognition unless mode="production"
  assert.equal(saved?.recognitionConfidence, 50);
  assert.equal((await database.reviewRecords.toArray())[0]?.mode, "cloze");
  await database.delete();
});

test("completeReview defaults to current time when now is not provided", async () => {
  const database = new ExplanationDatabase("complete-review-now-test");
  const item = {
    id: "item-3", kind: "word", text: "먹어요", state: "learning",
    recognitionConfidence: 40, productionConfidence: 15, encounters: 2,
    successes: 1, failures: 0, contextIds: [],
    lastSeenAt: "2026-08-25T10:00:00.000Z", nextReviewAt: "2026-08-26T09:00:00.000Z"
  };
  await putLearningItem(database, item);

  const start = Date.now();
  await completeReview({
    database,
    review: { item },
    mode: "recognition",
    outcome: "success",
  });
  const end = Date.now();

  const records = await database.reviewRecords.toArray();
  const reviewedAtTime = Date.parse(records[0]?.reviewedAt ?? "");
  assert.ok(reviewedAtTime >= start && reviewedAtTime <= end, "reviewedAt should be close to current time");
  await database.delete();
});

test("completeReview handles item without lastSeenAt or nextReviewAt", async () => {
  const database = new ExplanationDatabase("complete-review-missing-dates-test");
  const item = {
    id: "item-4", kind: "word", text: "먹어요", state: "learning",
    recognitionConfidence: 40, productionConfidence: 15, encounters: 2,
    successes: 1, failures: 0, contextIds: [],
  };
  await putLearningItem(database, item);

  await completeReview({
    database,
    review: { item },
    mode: "recognition",
    outcome: "success",
    now: "2026-08-26T10:00:00.000Z"
  });

  const saved = await database.learningItems.get(item.id);
  assert.equal(saved?.recognitionConfidence, 50); // It updates correctly even without dates
  await database.delete();
});

test("completeReview handles item with nextReviewAt but missing lastSeenAt", async () => {
  const database = new ExplanationDatabase("complete-review-missing-lastseenat-test");
  const item = {
    id: "item-5", kind: "word", text: "먹어요", state: "learning",
    recognitionConfidence: 40, productionConfidence: 15, encounters: 2,
    successes: 1, failures: 0, contextIds: [],
    nextReviewAt: "2026-08-26T09:00:00.000Z" // no lastSeenAt
  };
  await putLearningItem(database, item);

  await completeReview({
    database,
    review: { item },
    mode: "recognition",
    outcome: "success",
    now: "2026-08-27T10:00:00.000Z"
  });

  const saved = await database.learningItems.get(item.id);
  assert.ok(saved);
  assert.equal(saved.recognitionConfidence, 50);
  await database.delete();
});
