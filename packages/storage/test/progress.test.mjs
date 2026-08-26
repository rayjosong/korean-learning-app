import "fake-indexeddb/auto";
import assert from "node:assert/strict";
import test from "node:test";
import Dexie from "dexie";

import {
  ExplanationDatabase,
  getProgressSnapshotInput,
  recordStudiedContent
} from "../src/index.ts";

test("version 6 upgrades prior storage and records studied content", async () => {
  const name = "progress-migration-test";
  const prior = new Dexie(name);
  prior.version(5).stores({
    explanations: "key, createdAt",
    wordExplanations: "key",
    learningItems: "id, text, lastSeenAt",
    learningContexts: "id, itemId, createdAt",
    reviewRecords: "id, itemId, reviewedAt, mode"
  });
  await prior.open();
  await prior.close();

  const database = new ExplanationDatabase(name);
  await recordStudiedContent(database, { videoId: "video-1", studiedAt: "2026-08-26T10:00:00.000Z" });
  await recordStudiedContent(database, { videoId: "video-1", studiedAt: "2026-08-26T11:00:00.000Z" });

  const input = await getProgressSnapshotInput(database);
  assert.deepEqual(input.studiedContent, [{
    videoId: "video-1",
    firstStudiedAt: "2026-08-26T10:00:00.000Z",
    lastStudiedAt: "2026-08-26T11:00:00.000Z"
  }]);
  await database.delete();
});
