import "fake-indexeddb/auto";
import assert from "node:assert/strict";
import test from "node:test";
import Dexie from "dexie";

import { ExplanationDatabase, getContentProgressSnapshots, putContentProgressSnapshot } from "../src/index.ts";

test("version 7 preserves prior data and deduplicates a visit snapshot", async () => {
  const name = "revisit-storage-test";
  const prior = new Dexie(name);
  prior.version(6).stores({
    explanations: "key, createdAt",
    wordExplanations: "key",
    learningItems: "id, text, lastSeenAt",
    learningContexts: "id, itemId, createdAt",
    reviewRecords: "id, itemId, reviewedAt, mode",
    studiedContent: "videoId, firstStudiedAt, lastStudiedAt"
  });
  await prior.open();
  await prior.close();
  const database = new ExplanationDatabase(name);
  const snapshot = {
    id: "video-1:visit-1", videoId: "video-1", capturedAt: "2026-08-26T00:00:00.000Z",
    difficultyBand: "intermediate", likelyComprehension: { min: 40, max: 60 },
    comprehensionMidpoint: 50, source: "fallback"
  };
  await putContentProgressSnapshot(database, snapshot);
  await putContentProgressSnapshot(database, { ...snapshot, comprehensionMidpoint: 55 });
  assert.equal((await getContentProgressSnapshots(database, "video-1")).length, 1);
  assert.equal((await getContentProgressSnapshots(database, "video-1"))[0].comprehensionMidpoint, 55);
  await database.delete();
});
