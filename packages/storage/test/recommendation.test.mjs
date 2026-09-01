import "fake-indexeddb/auto";
import assert from "node:assert/strict";
import test from "node:test";
import Dexie from "dexie";

import {
  ExplanationDatabase,
  getRecommendationInput,
  putContentResume,
  putRecommendationDismissal,
  recordStudiedContent
} from "../src/index.ts";
import { getAiProviderSettings } from "../src/ai-settings.ts";

test("reads recommendation evidence consistently and round-trips dismissals", async () => {
  const database = new ExplanationDatabase("recommendation-input-test");
  await putContentResume(database, {
    videoId: "resume",
    sourceUrl: "https://youtu.be/resume",
    lastPositionMs: 2500,
    completed: false,
    updatedAt: "2026-08-29T00:00:00.000Z"
  });
  await recordStudiedContent(database, {
    videoId: "studied",
    sourceUrl: "https://youtu.be/studied",
    studiedAt: "2026-08-15T00:00:00.000Z"
  });
  await putRecommendationDismissal(database, {
    fingerprint: "start-new:v1:revision",
    dismissedAt: "2026-08-29T00:00:00.000Z",
    dismissedUntil: "2026-09-05T00:00:00.000Z"
  });

  const result = await getRecommendationInput(database, "2026-08-29T01:00:00.000Z");
  assert.equal(result.resume?.videoId, "resume");
  assert.equal(result.studiedContent[0]?.videoId, "studied");
  assert.equal(result.dismissals[0]?.fingerprint, "start-new:v1:revision");
  await database.delete();
});

test("version 10 -> 11 preserves existing records and provider settings", async () => {
  const name = "recommendation-migration-test";
  const prior = new Dexie(name);
  prior.version(10).stores({
    explanations: "key, createdAt",
    wordExplanations: "key",
    learningItems: "id, text, lastSeenAt",
    learningContexts: "id, itemId, createdAt",
    reviewRecords: "id, itemId, reviewedAt, mode",
    studiedContent: "videoId, firstStudiedAt, lastStudiedAt",
    contentProgressSnapshots: "id, videoId, capturedAt",
    aiProviderSettings: "id",
    assistanceSettings: "id",
    contentResume: "videoId, updatedAt"
  });
  await prior.open();
  await prior.table("studiedContent").put({
    videoId: "existing",
    firstStudiedAt: "2026-08-20T00:00:00.000Z",
    lastStudiedAt: "2026-08-21T00:00:00.000Z"
  });
  await prior.table("aiProviderSettings").put({
    id: "default",
    provider: "openai-compatible",
    apiKey: "keep-local-only",
    model: "fixture-model",
    baseUrl: "https://example.invalid/v1",
    updatedAt: "2026-08-21T00:00:00.000Z"
  });
  await prior.close();

  const database = new ExplanationDatabase(name);
  await database.open();
  assert.equal((await database.studiedContent.get("existing"))?.videoId, "existing");
  const settings = await getAiProviderSettings(database);
  assert.equal(settings?.profiles.openai?.apiKey, "keep-local-only");
  await putRecommendationDismissal(database, {
    fingerprint: "review:v1:test",
    dismissedAt: "2026-08-29T00:00:00.000Z",
    dismissedUntil: "2026-09-05T00:00:00.000Z"
  });
  assert.equal((await database.recommendationDismissals.get("review:v1:test"))?.dismissedUntil, "2026-09-05T00:00:00.000Z");
  await database.delete();
});
