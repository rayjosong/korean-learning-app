import "fake-indexeddb/auto";
import assert from "node:assert/strict";
import test from "node:test";
import Dexie from "dexie";

import { ExplanationDatabase, putReviewRecord } from "../src/index.ts";

test("version 5 upgrades a version 4 database and stores the completed review mode", async () => {
  const name = "review-records-migration-test";
  const prior = new Dexie(name);
  prior.version(4).stores({
    explanations: "key, createdAt",
    wordExplanations: "key",
    learningItems: "id, text, lastSeenAt",
    learningContexts: "id, itemId, createdAt"
  });
  await prior.open();
  await prior.close();

  const database = new ExplanationDatabase(name);
  await database.open();
  await putReviewRecord(database, {
    id: "production-review-1",
    itemId: "item-1",
    mode: "production",
    outcome: "success",
    reviewedAt: "2026-08-26T10:00:00.000Z"
  });

  assert.deepEqual(await database.reviewRecords.get("production-review-1"), {
    id: "production-review-1",
    itemId: "item-1",
    mode: "production",
    outcome: "success",
    reviewedAt: "2026-08-26T10:00:00.000Z"
  });
  await database.delete();
});

test("version 8 upgrades a version 7 database and adds AI provider settings", async () => {
  const name = "ai-settings-migration-test";
  const prior = new Dexie(name);
  prior.version(7).stores({
    explanations: "key, createdAt",
    wordExplanations: "key",
    learningItems: "id, text, lastSeenAt",
    learningContexts: "id, itemId, createdAt",
    reviewRecords: "id, itemId, reviewedAt, mode",
    studiedContent: "videoId, firstStudiedAt, lastStudiedAt",
    contentProgressSnapshots: "id, videoId, capturedAt"
  });
  await prior.open();
  await prior.close();

  const database = new ExplanationDatabase(name);
  await database.open();
  assert.ok(database.aiProviderSettings);
  await database.delete();
});
