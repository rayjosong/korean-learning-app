import "fake-indexeddb/auto";
import assert from "node:assert/strict";
import test from "node:test";
import Dexie from "dexie";

import {
  ExplanationDatabase,
  getDueReviewCount,
  getMostRecentResumableContent,
  getRecentStudiedContent,
  putContentResume,
  putLearningItem,
  recordStudiedContent
} from "../src/index.ts";

test("selects the newest unfinished resume and ignores completed or empty positions", async () => {
  const database = new ExplanationDatabase("home-resume-selection-test");
  await putContentResume(database, {
    videoId: "completed",
    sourceUrl: "https://youtu.be/completed",
    lastPositionMs: 9000,
    completed: true,
    updatedAt: "2026-08-26T03:00:00.000Z"
  });
  await putContentResume(database, {
    videoId: "empty",
    sourceUrl: "https://youtu.be/empty",
    lastPositionMs: 0,
    completed: false,
    updatedAt: "2026-08-26T04:00:00.000Z"
  });
  await putContentResume(database, {
    videoId: "older",
    sourceUrl: "https://youtu.be/older",
    lastPositionMs: 12000,
    completed: false,
    updatedAt: "2026-08-26T05:00:00.000Z"
  });
  await putContentResume(database, {
    videoId: "newer",
    sourceUrl: "https://youtu.be/newer",
    lastPositionMs: 24000,
    completed: false,
    updatedAt: "2026-08-26T06:00:00.000Z"
  });

  const resume = await getMostRecentResumableContent(database);
  assert.equal(resume?.videoId, "newer");
  assert.equal(resume?.lastPositionMs, 24000);
});

test("recent studied content preserves source metadata and deterministic order", async () => {
  const database = new ExplanationDatabase("home-recent-content-test");
  await recordStudiedContent(database, {
    videoId: "older",
    sourceUrl: "https://youtu.be/older",
    title: "Older video",
    studiedAt: "2026-08-26T05:00:00.000Z"
  });
  await recordStudiedContent(database, {
    videoId: "newer",
    sourceUrl: "https://youtu.be/newer",
    title: "Newer video",
    studiedAt: "2026-08-26T06:00:00.000Z"
  });

  const recent = await getRecentStudiedContent(database);
  assert.deepEqual(recent.map((record) => record.videoId), ["newer", "older"]);
  assert.equal(recent[0].title, "Newer video");
});

test("due review count uses the same learning-state boundary as the review queue", async () => {
  const database = new ExplanationDatabase("home-due-count-test");
  await putLearningItem(database, {
    id: "due",
    kind: "word",
    text: "due",
    state: "learning",
    recognitionConfidence: 0,
    productionConfidence: 0,
    encounters: 1,
    successes: 0,
    failures: 0,
    contextIds: [],
    nextReviewAt: "2026-08-26T09:00:00.000Z"
  });
  await putLearningItem(database, {
    id: "future",
    kind: "word",
    text: "future",
    state: "learning",
    recognitionConfidence: 0,
    productionConfidence: 0,
    encounters: 1,
    successes: 0,
    failures: 0,
    contextIds: [],
    nextReviewAt: "2026-08-26T11:00:00.000Z"
  });
  await putLearningItem(database, {
    id: "known",
    kind: "word",
    text: "known",
    state: "known",
    recognitionConfidence: 0,
    productionConfidence: 0,
    encounters: 1,
    successes: 0,
    failures: 0,
    contextIds: [],
    nextReviewAt: "2026-08-26T09:00:00.000Z"
  });

  assert.equal(await getDueReviewCount(database, "2026-08-26T10:00:00.000Z"), 1);
});

test("version 10 migration adds resume storage without losing version 9 data", async () => {
  const name = "home-resume-migration-test";
  const prior = new Dexie(name);
  prior.version(9).stores({
    explanations: "key, createdAt",
    wordExplanations: "key",
    learningItems: "id, text, lastSeenAt",
    learningContexts: "id, itemId, createdAt",
    reviewRecords: "id, itemId, reviewedAt, mode",
    studiedContent: "videoId, firstStudiedAt, lastStudiedAt",
    contentProgressSnapshots: "id, videoId, capturedAt",
    aiProviderSettings: "id",
    assistanceSettings: "id"
  });
  await prior.open();
  await prior.table("studiedContent").put({
    videoId: "existing",
    firstStudiedAt: "2026-08-26T00:00:00.000Z",
    lastStudiedAt: "2026-08-26T01:00:00.000Z"
  });
  await prior.close();

  const database = new ExplanationDatabase(name);
  await putContentResume(database, {
    videoId: "new",
    sourceUrl: "https://youtu.be/new",
    lastPositionMs: 1000,
    completed: false,
    updatedAt: "2026-08-26T02:00:00.000Z"
  });
  assert.equal((await database.studiedContent.get("existing"))?.videoId, "existing");
  assert.equal((await database.contentResume.get("new"))?.lastPositionMs, 1000);
  await database.delete();
});
