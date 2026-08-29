import "fake-indexeddb/auto";
import assert from "node:assert/strict";
import test from "node:test";

import { ExplanationDatabase, putCachedExplanation, putLearningContext, putLearningItem } from "@korean-learning/storage";
import { completeContextualReview, loadNextContextualReview } from "./review-session.ts";

test("contextual review resolves newest usable source and persists a recognition outcome atomically", async () => {
  const database = new ExplanationDatabase("contextual-review-session");
  const item = {
    id: "item-1", kind: "phrase", text: "걸어가려고요", state: "learning",
    recognitionConfidence: 40, productionConfidence: 20, encounters: 1, successes: 0, failures: 0,
    contextIds: ["old", "new"], lastSeenAt: "2026-01-10T00:00:00.000Z", nextReviewAt: "2026-01-11T00:00:00.000Z"
  };
  await putLearningItem(database, item);
  await putLearningContext(database, {
    id: "old", itemId: item.id, videoId: "", transcriptSegmentId: "old", sentence: "old", startTimeMs: 0, endTimeMs: 1_000, createdAt: "2026-01-10T00:00:00.000Z"
  });
  await putLearningContext(database, {
    id: "new", itemId: item.id, videoId: "video-1", transcriptSegmentId: "segment-2", sentence: "그래서 그냥 걸어가려고요.", startTimeMs: 4_000, endTimeMs: 7_500, createdAt: "2026-01-12T00:00:00.000Z"
  });
  await putCachedExplanation(database, {
    key: "fixture:그래서 그냥 걸어가려고요.", sentence: "그래서 그냥 걸어가려고요.", promptVersion: "fixture",
    explanation: { sentence: "그래서 그냥 걸어가려고요.", naturalMeaning: "So I’m just going to walk there.", breakdown: [], grammar: [], speechLevel: "해요체" },
    createdAt: "2026-01-12T00:00:00.000Z"
  });

  const session = await loadNextContextualReview(database, "2026-01-15T00:00:00.000Z");
  assert.equal(session?.context?.id, "new");
  assert.equal(session?.naturalMeaning, "So I’m just going to walk there.");
  await completeContextualReview(database, { review: session.review, outcome: "success", now: "2026-01-15T00:00:00.000Z" });
  assert.equal((await database.learningItems.get(item.id))?.recognitionConfidence, 50);
  assert.deepEqual((await database.reviewRecords.toArray()).map((record) => [record.mode, record.outcome]), [["recognition", "success"]]);
  await database.delete();
});
