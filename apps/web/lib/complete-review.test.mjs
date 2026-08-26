import "fake-indexeddb/auto";
import assert from "node:assert/strict";
import test from "node:test";

import { completeReview } from "./complete-cloze-review.ts";
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
