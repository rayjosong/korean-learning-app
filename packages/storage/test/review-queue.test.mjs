import "fake-indexeddb/auto";
import assert from "node:assert/strict";
import test from "node:test";

import {
  ExplanationDatabase,
  getDueReviewItems,
  putLearningContext,
  putLearningItem
} from "../src/index.ts";

function learningItem(id, nextReviewAt) {
  return {
    id,
    kind: "word",
    text: id,
    state: "learning",
    recognitionConfidence: 0,
    productionConfidence: 0,
    encounters: 1,
    successes: 0,
    failures: 0,
    contextIds: [`${id}-context`],
    lastSeenAt: "2026-08-26T00:00:00.000Z",
    nextReviewAt
  };
}

test("due reviews are oldest-first, capped, and include a source sentence", async () => {
  const database = new ExplanationDatabase("due-review-items-test");
  await putLearningItem(database, learningItem("later", "2026-08-26T09:00:00.000Z"));
  await putLearningItem(database, learningItem("earlier", "2026-08-26T08:00:00.000Z"));
  await putLearningItem(database, learningItem("future", "2026-08-26T11:00:00.000Z"));
  await putLearningContext(database, {
    id: "earlier-context", itemId: "earlier", videoId: "video-1", transcriptSegmentId: "segment-1",
    sentence: "이 문장으로 복습해요.", startTimeMs: 61000, endTimeMs: 62000, createdAt: "2026-08-26T00:00:00.000Z"
  });

  const due = await getDueReviewItems(database, { now: "2026-08-26T10:00:00.000Z", limit: 1 });
  assert.deepEqual(due.map(({ item }) => item.id), ["earlier"]);
  assert.equal(due[0].context?.sentence, "이 문장으로 복습해요.");
});

test("non-learning items are not included in the review queue", async () => {
  const database = new ExplanationDatabase("due-known-items-test");
  await putLearningItem(database, { ...learningItem("known", "2026-08-26T08:00:00.000Z"), state: "known" });

  const due = await getDueReviewItems(database, { now: "2026-08-26T10:00:00.000Z" });
  assert.deepEqual(due, []);
});
