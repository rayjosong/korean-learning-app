import "fake-indexeddb/auto";
import assert from "node:assert/strict";
import test from "node:test";

import {
  ExplanationDatabase,
  getRecentExplanationRecords,
  getRecentLearningItems,
  putCachedExplanation,
  putLearningContext,
  putLearningItem
} from "../src/index.ts";

test("recent sentence explanations are returned newest first", async () => {
  const database = new ExplanationDatabase("recent-explanations-test");

  await putCachedExplanation(database, {
    key: "v1:earlier",
    sentence: "먼저 설명한 문장",
    promptVersion: "v1",
    explanation: { sentence: "먼저 설명한 문장", naturalMeaning: "Earlier", breakdown: [], grammar: [] },
    createdAt: "2026-08-26T00:00:00.000Z"
  });
  await putCachedExplanation(database, {
    key: "v1:later",
    sentence: "나중에 설명한 문장",
    promptVersion: "v1",
    explanation: { sentence: "나중에 설명한 문장", naturalMeaning: "Later", breakdown: [], grammar: [] },
    createdAt: "2026-08-26T01:00:00.000Z"
  });

  const records = await getRecentExplanationRecords(database, 1);
  assert.deepEqual(records.map((record) => record.sentence), ["나중에 설명한 문장"]);
});

test("recent learning items include their latest available source context", async () => {
  const database = new ExplanationDatabase("recent-learning-items-test");

  await putLearningItem(database, {
    id: "older",
    kind: "word",
    text: "먼저",
    state: "known",
    recognitionConfidence: 0,
    productionConfidence: 0,
    encounters: 1,
    successes: 0,
    failures: 0,
    contextIds: ["older-context"],
    lastSeenAt: "2026-08-26T00:00:00.000Z"
  });
  await putLearningItem(database, {
    id: "newer",
    kind: "word",
    text: "나중",
    state: "learning",
    recognitionConfidence: 0,
    productionConfidence: 0,
    encounters: 1,
    successes: 0,
    failures: 0,
    contextIds: ["old-context", "new-context"],
    lastSeenAt: "2026-08-26T01:00:00.000Z"
  });
  await putLearningContext(database, {
    id: "old-context",
    itemId: "newer",
    videoId: "video-old",
    transcriptSegmentId: "one",
    sentence: "예전 문장",
    startTimeMs: 1000,
    endTimeMs: 2000,
    createdAt: "2026-08-26T00:30:00.000Z"
  });
  await putLearningContext(database, {
    id: "new-context",
    itemId: "newer",
    videoId: "video-new",
    transcriptSegmentId: "two",
    sentence: "최근 문장",
    startTimeMs: 61000,
    endTimeMs: 62000,
    createdAt: "2026-08-26T01:30:00.000Z"
  });

  const recent = await getRecentLearningItems(database, 2);
  assert.deepEqual(recent.map(({ item }) => item.text), ["나중", "먼저"]);
  assert.equal(recent[0].context?.videoId, "video-new");
  assert.equal(recent[0].context?.startTimeMs, 61000);
});